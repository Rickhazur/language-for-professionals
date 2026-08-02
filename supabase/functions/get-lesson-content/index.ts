// Supabase Edge Function: obtiene (o genera y cachea) el contenido
// interactivo de un módulo de curso, según su skill_focus. El vocabulario es
// un caso especial (etiqueta filas de course_plan_vocabulary a este módulo
// en vez de escribir en course_plan_item_content); el resto (grammar/
// reading/listening = quiz, speaking = frases, writing = consigna) se genera
// una vez con IA y se cachea. Mismo proveedor configurable que
// generate-course-plan (AI_API_KEY / AI_BASE_URL / AI_MODEL).

import { createClient } from 'npm:@supabase/supabase-js@2';

type AdminClient = ReturnType<typeof createClient>;

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
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

interface StudentContext {
  occupation: string;
  industry: string;
  targetLanguage: string;
  nativeLanguage: string;
  level: string;
}

interface ModuleContext {
  title: string;
  description: string | null;
  skillFocus: string;
}

async function callAi(aiBaseUrl: string, aiApiKey: string, aiModel: string, systemPrompt: string): Promise<string> {
  const res = await fetch(`${aiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiApiKey}` },
    body: JSON.stringify({
      model: aiModel,
      messages: [{ role: 'system', content: systemPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Error del modelo (${res.status}): ${errorBody.slice(0, 500)}`);
  }
  const completion = await res.json();
  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) throw new Error('El modelo no devolvió contenido.');
  return raw;
}

function stripParenthetical(text: string): string {
  return text.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

// ── Quiz: grammar / reading / listening ──────────────────────────────────
interface QuizContent {
  intro: string | null;
  questions: { prompt: string; options: string[]; answerIndex: number }[];
}

function buildQuizPrompt(student: StudentContext, mod: ModuleContext): string {
  const targetName = LANGUAGE_NAMES[student.targetLanguage] ?? student.targetLanguage;
  const introInstruction =
    mod.skillFocus === 'reading'
      ? `Incluye "intro": un texto de lectura de 150 a 250 palabras en ${targetName}, relevante al tema del módulo y a la profesión del estudiante.`
      : mod.skillFocus === 'listening'
        ? `Incluye "intro": un guion corto en ${targetName}, con fraseo natural hablado (sin acotaciones ni indicaciones de escena) — se va a convertir a audio con texto a voz. LÍMITE ESTRICTO: máximo 400 caracteres en total (no palabras, caracteres) — cuenta antes de responder. Prioriza que sea breve y natural sobre que sea extenso.`
        : `"intro" debe ser null (los ejercicios de gramática no llevan texto introductorio).`;

  return `Eres un diseñador de ejercicios de idiomas para profesionales. Generas un
ejercicio de ${mod.skillFocus === 'reading' ? 'comprensión de lectura' : mod.skillFocus === 'listening' ? 'comprensión auditiva' : 'gramática'}
para un módulo específico de un curso personalizado.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin
markdown, con este esquema exacto:
{
  "intro": string | null,
  "questions": [
    { "prompt": string, "options": [string, string, string, string], "answerIndex": integer }
  ]
}

Módulo: "${mod.title}"${mod.description ? ` — ${mod.description}` : ''}
Perfil del estudiante: ${student.occupation} en la industria de ${student.industry}.
Nivel CEFR: ${student.level}. Idioma de práctica: ${targetName}.

${introInstruction}

Reglas:
1. "questions" debe tener exactamente 5 preguntas, cada una con 4 opciones y answerIndex
   apuntando a la correcta.
2. Todo el texto de "intro", "prompt" y "options" va en ${targetName} — es un ejercicio
   de idioma, no una explicación en otro idioma.
3. La dificultad debe corresponder al nivel CEFR indicado.
4. El contenido debe ser específico a la profesión/industria del estudiante cuando sea
   natural — evita ejemplos genéricos sin relación con su trabajo.
5. No agregues campos fuera del esquema.`;
}

function validateQuizContent(content: unknown): string | null {
  const c = content as Partial<QuizContent> | null;
  if (!c || typeof c !== 'object') return 'no es un objeto';
  if (c.intro !== null && typeof c.intro !== 'string') return 'intro inválido';
  if (!Array.isArray(c.questions) || c.questions.length === 0) return 'faltan questions';
  for (const q of c.questions) {
    if (
      typeof q.prompt !== 'string' ||
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      typeof q.answerIndex !== 'number'
    ) {
      return 'una pregunta tiene formato inválido';
    }
  }
  return null;
}

// ── Speaking: frases para practicar pronunciación ────────────────────────
interface SpeakingContent {
  sentences: { term: string | null; sentence: string }[];
}

function buildSpeakingPrompt(student: StudentContext, mod: ModuleContext): string {
  const targetName = LANGUAGE_NAMES[student.targetLanguage] ?? student.targetLanguage;
  return `Eres un diseñador de ejercicios de pronunciación para profesionales. Generas
frases cortas para practicar pronunciación (shadowing) en un módulo específico
de un curso personalizado.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin
markdown, con este esquema exacto:
{ "sentences": [{ "term": string | null, "sentence": string }] }

Módulo: "${mod.title}"${mod.description ? ` — ${mod.description}` : ''}
Perfil del estudiante: ${student.occupation} en la industria de ${student.industry}.
Nivel CEFR: ${student.level}. Idioma de práctica: ${targetName}.

Reglas:
1. Genera exactamente 4 frases, relevantes al tema del módulo y a la profesión del
   estudiante, en ${targetName}.
2. "term" es opcional: si la frase gira en torno a un término clave, ponlo ahí; si no,
   usa null.
3. "sentence" debe contener ÚNICAMENTE la oración en ${targetName} — sin traducción
   entre paréntesis ni en ningún otro formato. Se usa tal cual para generar audio y
   analizar pronunciación; mezclar idiomas ahí produce audio mal pronunciado.
4. La dificultad debe corresponder al nivel CEFR indicado.
5. No agregues campos fuera del esquema.`;
}

function validateSpeakingContent(content: unknown): string | null {
  const c = content as Partial<SpeakingContent> | null;
  if (!c || typeof c !== 'object') return 'no es un objeto';
  if (!Array.isArray(c.sentences) || c.sentences.length === 0) return 'faltan sentences';
  for (const s of c.sentences) {
    if (typeof s.sentence !== 'string' || !s.sentence) return 'una frase tiene formato inválido';
  }
  return null;
}

// ── Writing: consigna profesional ────────────────────────────────────────
interface WritingContent {
  prompt: string;
  guidance: string | null;
}

function buildWritingPrompt(student: StudentContext, mod: ModuleContext): string {
  const targetName = LANGUAGE_NAMES[student.targetLanguage] ?? student.targetLanguage;
  const nativeName = LANGUAGE_NAMES[student.nativeLanguage] ?? student.nativeLanguage;
  return `Eres un diseñador de ejercicios de escritura para profesionales. Generas una
consigna de escritura para un módulo específico de un curso personalizado.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin
markdown, con este esquema exacto:
{ "prompt": string, "guidance": string | null }

Módulo: "${mod.title}"${mod.description ? ` — ${mod.description}` : ''}
Perfil del estudiante: ${student.occupation} en la industria de ${student.industry}.
Nivel CEFR: ${student.level}. El estudiante escribirá en ${targetName}.

Reglas:
1. "prompt" es la instrucción de la tarea de escritura (ej. "Escribe un correo de
   seguimiento a un cliente después de una reunión"), en ${nativeName}, específica a
   la profesión/industria del estudiante y al tema del módulo.
2. "guidance" (opcional) son 2-3 puntos breves de qué incluir, también en ${nativeName}.
3. El estudiante va a escribir su respuesta en ${targetName} — la consigna debe dejar
   eso claro implícitamente por el contexto del curso, no hace falta decirlo explícito.
4. La complejidad de la tarea debe corresponder al nivel CEFR indicado.
5. No agregues campos fuera del esquema.`;
}

function validateWritingContent(content: unknown): string | null {
  const c = content as Partial<WritingContent> | null;
  if (!c || typeof c !== 'object') return 'no es un objeto';
  if (typeof c.prompt !== 'string' || !c.prompt) return 'falta prompt';
  if (c.guidance !== null && c.guidance !== undefined && typeof c.guidance !== 'string') return 'guidance inválido';
  return null;
}

// ── Vocabulario: caso especial, genera filas de course_plan_vocabulary ──
interface VocabTermDraft {
  term: string;
  translation: string;
  example_sentence: string;
}

function buildVocabPrompt(student: StudentContext, mod: ModuleContext): string {
  const targetName = LANGUAGE_NAMES[student.targetLanguage] ?? student.targetLanguage;
  const nativeName = LANGUAGE_NAMES[student.nativeLanguage] ?? student.nativeLanguage;
  return `Eres un diseñador curricular de vocabulario profesional. Generas términos de
vocabulario para un módulo específico de un curso personalizado.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin
markdown, con este esquema exacto:
{ "terms": [{ "term": string, "translation": string, "example_sentence": string }] }

Módulo: "${mod.title}"${mod.description ? ` — ${mod.description}` : ''}
Perfil del estudiante: ${student.occupation} en la industria de ${student.industry}.
Nivel CEFR: ${student.level}.

Reglas:
1. Genera entre 6 y 8 términos específicos al tema del módulo y a la profesión del
   estudiante.
2. "term" va en ${targetName}, "translation" en ${nativeName} (campos separados).
3. "example_sentence" debe contener ÚNICAMENTE la oración en ${targetName} — sin
   traducción entre paréntesis. Se usa tal cual para generar audio.
4. La dificultad debe corresponder al nivel CEFR indicado.
5. No repitas términos obvios que ya estarían en un curso básico genérico.`;
}

function validateVocabDraft(content: unknown): string | null {
  const c = content as { terms?: VocabTermDraft[] } | null;
  if (!c || typeof c !== 'object') return 'no es un objeto';
  if (!Array.isArray(c.terms) || c.terms.length === 0) return 'faltan terms';
  for (const t of c.terms) {
    if (typeof t.term !== 'string' || typeof t.translation !== 'string') return 'un término tiene formato inválido';
  }
  return null;
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
    const coursePlanItemId = typeof body?.coursePlanItemId === 'string' ? body.coursePlanItemId : '';
    const regenerate = body?.regenerate === true;

    if (!coursePlanItemId) {
      return jsonResponse({ error: 'Falta "coursePlanItemId".' }, 400);
    }

    const admin: AdminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: item } = await admin
      .from('course_plan_items')
      .select('id, course_plan_id, title, description, skill_focus')
      .eq('id', coursePlanItemId)
      .maybeSingle();

    if (!item) {
      return jsonResponse({ error: 'Módulo no encontrado.' }, 404);
    }

    const { data: plan } = await admin
      .from('course_plans')
      .select('student_id, language')
      .eq('id', item.course_plan_id)
      .maybeSingle();

    if (!plan || plan.student_id !== user.id) {
      return jsonResponse({ error: 'Este módulo no pertenece a tu plan de curso.' }, 403);
    }

    const { data: studentProfile } = await admin
      .from('student_profiles')
      .select('occupation, industry, target_language, native_language, proficiency_level')
      .eq('id', user.id)
      .single();

    if (!studentProfile) {
      return jsonResponse({ error: 'No se encontró el perfil de estudiante.' }, 404);
    }

    const student: StudentContext = {
      occupation: studentProfile.occupation ?? 'profesional',
      industry: studentProfile.industry ?? 'general',
      targetLanguage: studentProfile.target_language,
      nativeLanguage: studentProfile.native_language,
      level: CEFR_LEVELS.includes(studentProfile.proficiency_level) ? studentProfile.proficiency_level : 'B1',
    };
    const mod: ModuleContext = { title: item.title, description: item.description, skillFocus: item.skill_focus };

    // ── Vocabulario: caso especial ──
    if (item.skill_focus === 'vocabulary') {
      const { data: existingTerms } = await admin
        .from('course_plan_vocabulary')
        .select('*')
        .eq('course_plan_item_id', coursePlanItemId);

      if (existingTerms && existingTerms.length > 0 && !regenerate) {
        return jsonResponse({ vocabulary: existingTerms });
      }

      const raw = await callAi(aiBaseUrl, aiApiKey, aiModel, buildVocabPrompt(student, mod));
      let draft: { terms: VocabTermDraft[] };
      try {
        draft = JSON.parse(raw);
      } catch {
        return jsonResponse({ error: 'La respuesta del modelo no es JSON válido.' }, 502);
      }
      const validationError = validateVocabDraft(draft);
      if (validationError) {
        return jsonResponse({ error: `Respuesta del modelo con formato inválido: ${validationError}` }, 502);
      }

      const rows = draft.terms.map((t) => ({
        course_plan_id: item.course_plan_id,
        course_plan_item_id: coursePlanItemId,
        term: t.term,
        translation: t.translation,
        example_sentence: stripParenthetical(t.example_sentence ?? ''),
      }));

      const { data: inserted, error: insertError } = await admin
        .from('course_plan_vocabulary')
        .insert(rows)
        .select();

      if (insertError || !inserted) {
        return jsonResponse({ error: insertError?.message ?? 'No se pudo guardar el vocabulario.' }, 500);
      }

      return jsonResponse({ vocabulary: inserted });
    }

    // ── Resto de skills: cache en course_plan_item_content ──
    if (!regenerate) {
      const { data: cached } = await admin
        .from('course_plan_item_content')
        .select('content')
        .eq('course_plan_item_id', coursePlanItemId)
        .maybeSingle();

      if (cached) {
        return jsonResponse({ content: cached.content });
      }
    }

    let systemPrompt: string;
    let validate: (c: unknown) => string | null;

    if (item.skill_focus === 'speaking') {
      systemPrompt = buildSpeakingPrompt(student, mod);
      validate = validateSpeakingContent;
    } else if (item.skill_focus === 'writing') {
      systemPrompt = buildWritingPrompt(student, mod);
      validate = validateWritingContent;
    } else {
      // grammar | reading | listening
      systemPrompt = buildQuizPrompt(student, mod);
      validate = validateQuizContent;
    }

    const raw = await callAi(aiBaseUrl, aiApiKey, aiModel, systemPrompt);
    let content: unknown;
    try {
      content = JSON.parse(raw);
    } catch {
      return jsonResponse({ error: 'La respuesta del modelo no es JSON válido.' }, 502);
    }

    const validationError = validate(content);
    if (validationError) {
      return jsonResponse({ error: `Respuesta del modelo con formato inválido: ${validationError}` }, 502);
    }

    if (item.skill_focus === 'speaking') {
      (content as SpeakingContent).sentences = (content as SpeakingContent).sentences.map((s) => ({
        ...s,
        sentence: stripParenthetical(s.sentence),
      }));
    }

    // Defensa extra: el modelo no siempre respeta el límite de caracteres del
    // guion de listening (text-to-speech rechaza textos largos) — se trunca
    // en un punto de oración para no cortar a mitad de palabra.
    if (item.skill_focus === 'listening') {
      const quiz = content as QuizContent;
      const MAX_INTRO_CHARS = 450;
      if (quiz.intro && quiz.intro.length > MAX_INTRO_CHARS) {
        const truncated = quiz.intro.slice(0, MAX_INTRO_CHARS);
        const lastSentenceEnd = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('!'), truncated.lastIndexOf('?'));
        quiz.intro = lastSentenceEnd > 100 ? truncated.slice(0, lastSentenceEnd + 1) : truncated;
      }
    }

    const { error: upsertError } = await admin
      .from('course_plan_item_content')
      .upsert({ course_plan_item_id: coursePlanItemId, content, generated_at: new Date().toISOString() }, { onConflict: 'course_plan_item_id' });

    if (upsertError) {
      return jsonResponse({ error: upsertError.message }, 500);
    }

    return jsonResponse({ content });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
