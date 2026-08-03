// Supabase Edge Function: genera (para el panel del profesor) un resumen en
// lenguaje natural de en qué está fallando un estudiante, a partir de sus
// debilidades activas, intentos de shadowing recientes y sesiones de
// práctica recientes. Usa el mismo proveedor configurable (AI_API_KEY /
// AI_BASE_URL / AI_MODEL) que generate-course-plan.
//
// Quién puede llamarla: un profesor autenticado que esté asignado al
// estudiante (student_teacher_assignments) — se verifica a mano porque la
// función usa la service role key, que salta RLS.

import { createClient } from 'npm:@supabase/supabase-js@2';

const RECENT_ATTEMPTS_LIMIT = 10;
const RECENT_SESSIONS_LIMIT = 5;

const LANGUAGE_NAMES: Record<string, string> = { en: 'inglés', es: 'español' };

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
    const aiApiKey = Deno.env.get('AI_API_KEY');
    const aiBaseUrl = Deno.env.get('AI_BASE_URL') ?? 'https://api.openai.com/v1';
    const aiModel = Deno.env.get('AI_MODEL') ?? 'gpt-4o-mini';

    if (!aiApiKey) {
      return jsonResponse({ error: 'AI_API_KEY no está configurada en los secrets de la función.' }, 500);
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
    const studentId = typeof body?.studentId === 'string' ? body.studentId : '';
    if (!studentId) {
      return jsonResponse({ error: 'Falta "studentId".' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: assignment } = await admin
      .from('student_teacher_assignments')
      .select('id')
      .eq('teacher_id', user.id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!assignment) {
      return jsonResponse({ error: 'No tienes asignado a este estudiante.' }, 403);
    }

    const [{ data: studentProfile }, { data: weaknesses }, { data: attempts }, { data: sessions }] =
      await Promise.all([
        admin.from('student_profiles').select('*').eq('id', studentId).single(),
        admin
          .from('student_weaknesses')
          .select('target, weakness_type, sample_count, average_score')
          .eq('student_id', studentId)
          .eq('is_active', true),
        admin
          .from('shadowing_attempts')
          .select('reference_text, accuracy_score, fluency_score, prosody_score, pron_score, created_at')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(RECENT_ATTEMPTS_LIMIT),
        admin
          .from('practice_sessions')
          .select('session_type, duration_minutes, notes, started_at')
          .eq('student_id', studentId)
          .order('started_at', { ascending: false })
          .limit(RECENT_SESSIONS_LIMIT),
      ]);

    if (!studentProfile) {
      return jsonResponse({ error: 'No se encontró el perfil del estudiante.' }, 404);
    }

    // Sin debilidades, intentos ni sesiones, no hay nada real que resumir —
    // devolvemos eso explícitamente en vez de dejar que el modelo invente un
    // resumen genérico o vacío que el profesor podría leer en voz alta frente
    // al estudiante sin darse cuenta de que no dice nada real.
    const hasWeaknesses = (weaknesses ?? []).length > 0;
    const hasAttempts = (attempts ?? []).length > 0;
    const hasSessions = (sessions ?? []).length > 0;
    if (!hasWeaknesses && !hasAttempts && !hasSessions) {
      return jsonResponse({ insufficientData: true });
    }

    const targetLanguageName = LANGUAGE_NAMES[studentProfile.target_language] ?? studentProfile.target_language;

    const weaknessLines =
      (weaknesses ?? []).length > 0
        ? weaknesses!
            .map((w) => `- Sonido /${w.target}/: puntaje promedio ${w.average_score} en sus últimos ${w.sample_count} intentos.`)
            .join('\n')
        : 'Ninguna debilidad activa detectada por el momento.';

    const attemptLines =
      (attempts ?? []).length > 0
        ? attempts!
            .map(
              (a) =>
                `- "${a.reference_text}" → precisión ${a.accuracy_score ?? '—'}, fluidez ${a.fluency_score ?? '—'}, entonación ${a.prosody_score ?? '—'}, general ${a.pron_score ?? '—'}`
            )
            .join('\n')
        : 'Sin intentos de shadowing registrados todavía.';

    const sessionLines =
      (sessions ?? []).length > 0
        ? sessions!
            .map((s) => `- ${s.session_type}, ${s.duration_minutes ?? '—'} min${s.notes ? ` — ${s.notes}` : ''}`)
            .join('\n')
        : 'Sin sesiones de práctica registradas todavía.';

    const systemPrompt = `Eres un asistente para profesores de idiomas. Analizas el desempeño reciente de
un estudiante y escribes un resumen breve y accionable para que el profesor
lo lea antes de su próxima clase.

Perfil del estudiante:
- Ocupación: ${studentProfile.occupation ?? 'no especificada'}
- Industria: ${studentProfile.industry ?? 'no especificada'}
- Aprendiendo: ${targetLanguageName}
- Nivel: ${studentProfile.proficiency_level}

Debilidades de pronunciación activas (fonemas con error recurrente):
${weaknessLines}

Intentos de shadowing recientes (frase y puntajes de 0 a 100):
${attemptLines}

Sesiones de práctica recientes:
${sessionLines}

Escribe un resumen de 3 a 5 frases, en español, en tono profesional y
directo. Menciona el patrón más importante a trabajar, no una lista de
todo. No inventes datos que no estén arriba. No uses markdown, solo texto
plano.`;

    const aiResponse = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      return jsonResponse({ error: `Error del modelo (${aiResponse.status}): ${errorBody.slice(0, 500)}` }, 502);
    }

    const completion = await aiResponse.json();
    const summaryText = completion.choices?.[0]?.message?.content?.trim();

    if (!summaryText) {
      return jsonResponse({ error: 'El modelo no devolvió contenido.' }, 502);
    }

    const { data: summaryRow, error: insertError } = await admin
      .from('student_ai_summaries')
      .insert({ student_id: studentId, summary: summaryText })
      .select()
      .single();

    if (insertError || !summaryRow) {
      return jsonResponse({ error: insertError?.message ?? 'No se pudo guardar el resumen.' }, 500);
    }

    return jsonResponse({ summary: summaryRow });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
