// Supabase Edge Function: analiza una grabación de shadowing contra el texto
// de referencia usando Azure Pronunciation Assessment en el endpoint de
// audio corto (síncrono) — funciona en el tier gratuito F0 de Azure Speech,
// a diferencia de la Batch Transcription API que requiere tier Standard/S0.
// El cliente manda el audio ya grabado en la misma petición (base64); no hay
// Storage ni jobs asíncronos de por medio.
//
// Secrets requeridos (supabase secrets set ...):
//   AZURE_SPEECH_KEY    - mismo recurso Speech usado por text-to-speech.
//   AZURE_SPEECH_REGION - misma región, ej. "eastus".

import { createClient } from 'npm:@supabase/supabase-js@2';
import { BadgeAward, checkPhonemeMastery, recordActivityAndAwardPoints } from '../_shared/gamification.ts';
import { checkQuota, logUsage } from '../_shared/quota.ts';

const MAX_REFERENCE_LENGTH = 300;
const POINTS_PER_ATTEMPT = 5;
const POINTS_BONUS_THRESHOLD = 85;
const POINTS_BONUS = 10;
const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // 8MB, de sobra para una frase corta

const LOCALES: Record<string, string> = { en: 'en-US', es: 'es-MX' };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

interface AzurePhoneme {
  Phoneme: string;
  AccuracyScore?: number;
}

interface AzureWord {
  Word: string;
  AccuracyScore?: number;
  ErrorType?: string;
  Phonemes?: AzurePhoneme[];
}

interface AzureNBest {
  Display?: string;
  AccuracyScore?: number;
  FluencyScore?: number;
  ProsodyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  Words?: AzureWord[];
}

interface AzureRecognitionResult {
  RecognitionStatus?: string;
  DisplayText?: string;
  NBest?: AzureNBest[];
}

// ── Detección de debilidades activas ────────────────────────────────────
// Mira las últimas WEAKNESS_WINDOW veces que el estudiante practicó un
// fonema dado. Si al menos WEAKNESS_MIN_OCCURRENCES de esas veces salieron
// por debajo de WEAKNESS_THRESHOLD, es un patrón recurrente (no un intento
// suelto) y se marca/mantiene como debilidad activa. Si ya estaba marcada
// pero la ventana reciente mejoró, se resuelve — por eso es una ventana
// deslizante y no un promedio histórico completo: refleja el nivel actual,
// no persigue errores viejos ya superados.
const WEAKNESS_WINDOW = 5;
const WEAKNESS_MIN_OCCURRENCES = 3;
const WEAKNESS_THRESHOLD = 70;

async function refreshPhonemeStatus(
  admin: ReturnType<typeof createClient>,
  studentId: string,
  language: string,
  phoneme: string
): Promise<BadgeAward | null> {
  const { data: recent } = await admin
    .from('shadowing_phoneme_scores')
    .select('accuracy_score, created_at, shadowing_word_scores!inner(shadowing_attempts!inner(student_id, language))')
    .eq('phoneme', phoneme)
    .eq('shadowing_word_scores.shadowing_attempts.student_id', studentId)
    .eq('shadowing_word_scores.shadowing_attempts.language', language)
    .order('created_at', { ascending: false })
    .limit(WEAKNESS_WINDOW);

  const scores = (recent ?? [])
    .map((r: { accuracy_score: number | null }) => r.accuracy_score)
    .filter((s): s is number => typeof s === 'number');

  // Insignia de dominio: reutiliza esta misma consulta (ya trae los últimos
  // WEAKNESS_WINDOW = MASTERY_WINDOW puntajes) en vez de volver a pedirlos.
  const masteryBadge = await checkPhonemeMastery(admin, studentId, phoneme, scores);

  if (scores.length < WEAKNESS_MIN_OCCURRENCES) return masteryBadge;

  const lowCount = scores.filter((s) => s < WEAKNESS_THRESHOLD).length;
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const isWeak = lowCount >= WEAKNESS_MIN_OCCURRENCES;

  const { data: existing } = await admin
    .from('student_weaknesses')
    .select('id, is_active')
    .eq('student_id', studentId)
    .eq('language', language)
    .eq('weakness_type', 'phoneme')
    .eq('target', phoneme)
    .maybeSingle();

  if (isWeak) {
    await admin.from('student_weaknesses').upsert(
      {
        student_id: studentId,
        language,
        weakness_type: 'phoneme',
        target: phoneme,
        sample_count: scores.length,
        average_score: Math.round(average * 100) / 100,
        is_active: true,
        last_detected_at: new Date().toISOString(),
        resolved_at: null,
      },
      { onConflict: 'student_id,language,weakness_type,target' }
    );
  } else if (existing?.is_active) {
    await admin
      .from('student_weaknesses')
      .update({ is_active: false, resolved_at: new Date().toISOString() })
      .eq('id', existing.id);
  }

  return masteryBadge;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Falta el encabezado Authorization.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const azureKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureRegion = Deno.env.get('AZURE_SPEECH_REGION');

    if (!azureKey || !azureRegion) {
      return jsonResponse(
        { error: 'AZURE_SPEECH_KEY / AZURE_SPEECH_REGION no están configuradas en los secrets de la función.' },
        500
      );
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: 'No se pudo verificar el usuario.' }, 401);
    }

    const body = await req.json().catch(() => null);
    const audioBase64 = typeof body?.audioBase64 === 'string' ? body.audioBase64 : '';
    const contentType = typeof body?.contentType === 'string' ? body.contentType : '';
    const referenceText = typeof body?.referenceText === 'string' ? body.referenceText.trim() : '';
    const language = body?.language;
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;

    if (!audioBase64) {
      return jsonResponse({ error: 'Falta "audioBase64".' }, 400);
    }
    if (!contentType) {
      return jsonResponse({ error: 'Falta "contentType".' }, 400);
    }
    if (!referenceText) {
      return jsonResponse({ error: 'Falta "referenceText".' }, 400);
    }
    if (referenceText.length > MAX_REFERENCE_LENGTH) {
      return jsonResponse({ error: `"referenceText" supera el máximo de ${MAX_REFERENCE_LENGTH} caracteres.` }, 400);
    }
    const locale = LOCALES[language];
    if (!locale) {
      return jsonResponse({ error: `Idioma no soportado: ${language}` }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // El cupo del plan solo aplica al shadowing independiente (sessionId
    // real, referencia a practice_sessions). Las llamadas con sessionId nulo
    // vienen de la práctica de pronunciación dentro de una lección (ya
    // cuenta vía finalize-lesson-attempt) o del banco de frases de roleplay
    // (herramienta de apoyo, no consume cupo aparte).
    if (sessionId) {
      const quota = await checkQuota(admin, user.id);
      if (!quota.allowed) return jsonResponse({ error: quota.message }, 403);
    }

    const audioBytes = base64ToBytes(audioBase64);
    if (audioBytes.byteLength > MAX_AUDIO_BYTES) {
      return jsonResponse({ error: 'El audio es demasiado grande.' }, 400);
    }

    const pronunciationAssessmentHeader = btoa(
      JSON.stringify({
        ReferenceText: referenceText,
        GradingSystem: 'HundredMark',
        Granularity: 'Phoneme',
        Dimension: 'Comprehensive',
        EnableMiscue: true,
        PhonemeAlphabet: 'IPA',
      })
    );

    const azureResponse = await fetch(
      `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${locale}&format=detailed`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': contentType,
          'Pronunciation-Assessment': pronunciationAssessmentHeader,
          Accept: 'application/json',
        },
        body: audioBytes,
      }
    );

    if (!azureResponse.ok) {
      const errorBody = await azureResponse.text();
      return jsonResponse(
        { error: `Error de Azure Speech (${azureResponse.status}): ${errorBody.slice(0, 500)}` },
        502
      );
    }

    const result: AzureRecognitionResult = await azureResponse.json();

    if (result.RecognitionStatus !== 'Success' || !result.NBest?.[0]) {
      return jsonResponse(
        {
          error:
            'No se detectó voz reconocible en la grabación. Intenta grabar de nuevo, más cerca del micrófono.',
        },
        422
      );
    }

    const best = result.NBest[0];
    const words = best.Words ?? [];

    const { data: attempt, error: attemptError } = await admin
      .from('shadowing_attempts')
      .insert({
        session_id: sessionId,
        student_id: user.id,
        language,
        reference_text: referenceText,
        recognized_text: best.Display ?? result.DisplayText ?? null,
        accuracy_score: best.AccuracyScore ?? null,
        fluency_score: best.FluencyScore ?? null,
        prosody_score: best.ProsodyScore ?? null,
        completeness_score: best.CompletenessScore ?? null,
        pron_score: best.PronScore ?? null,
      })
      .select()
      .single();

    if (attemptError || !attempt) {
      return jsonResponse({ error: attemptError?.message ?? 'No se pudo guardar el resultado.' }, 500);
    }

    if (sessionId) {
      try {
        await logUsage(admin, user.id, 'shadowing');
      } catch (quotaError) {
        console.error('logUsage failed:', quotaError);
      }
    }

    const wordRows = words.map((w, index) => ({
      attempt_id: attempt.id,
      order_index: index,
      word: w.Word,
      accuracy_score: w.AccuracyScore ?? null,
      error_type: w.ErrorType ?? null,
    }));

    const { data: insertedWords, error: wordsError } = await admin
      .from('shadowing_word_scores')
      .insert(wordRows)
      .select();

    if (wordsError || !insertedWords) {
      return jsonResponse({ error: wordsError?.message ?? 'No se pudo guardar el desglose por palabra.' }, 500);
    }

    const phonemeRows = insertedWords.flatMap((wordRow, wordIndex) => {
      const phonemes = words[wordIndex]?.Phonemes ?? [];
      return phonemes.map((p, phonemeIndex) => ({
        word_score_id: wordRow.id,
        order_index: phonemeIndex,
        phoneme: p.Phoneme,
        accuracy_score: p.AccuracyScore ?? null,
      }));
    });

    let insertedPhonemes: { word_score_id: string }[] = [];
    if (phonemeRows.length > 0) {
      const { data, error: phonemesError } = await admin
        .from('shadowing_phoneme_scores')
        .insert(phonemeRows)
        .select();
      if (phonemesError) {
        return jsonResponse({ error: phonemesError.message }, 500);
      }
      insertedPhonemes = data ?? [];
    }

    // Nada de esto debe tumbar la respuesta principal si falla: el feedback
    // de esta grabación ya es válido y útil aunque la gamificación falle.
    let newBadges: BadgeAward[] = [];
    let gamification: { totalPoints: number; currentStreak: number; longestStreak: number } | null = null;

    try {
      const uniquePhonemes = [...new Set(phonemeRows.map((p) => p.phoneme))];
      for (const phoneme of uniquePhonemes) {
        const masteryBadge = await refreshPhonemeStatus(admin, user.id, language, phoneme);
        if (masteryBadge) newBadges.push(masteryBadge);
      }

      const points = POINTS_PER_ATTEMPT + (best.PronScore && best.PronScore >= POINTS_BONUS_THRESHOLD ? POINTS_BONUS : 0);
      const activityResult = await recordActivityAndAwardPoints(admin, user.id, points);
      gamification = {
        totalPoints: activityResult.totalPoints,
        currentStreak: activityResult.currentStreak,
        longestStreak: activityResult.longestStreak,
      };
      newBadges = [...newBadges, ...activityResult.newBadges];
    } catch (gamificationError) {
      console.error('gamification update failed:', gamificationError);
    }

    return jsonResponse({
      attempt,
      words: insertedWords.map((wordRow) => ({
        ...wordRow,
        phonemes: insertedPhonemes.filter((p) => p.word_score_id === wordRow.id),
      })),
      gamification,
      newBadges,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
