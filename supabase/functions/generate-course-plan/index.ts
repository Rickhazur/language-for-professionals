// Supabase Edge Function: genera un plan de curso personalizado con un modelo
// compatible con la API de OpenAI (fetch directo al endpoint de chat
// completions), y lo guarda en course_plans / course_plan_items /
// course_plan_vocabulary / course_plan_roleplays.
//
// Se ejecuta server-side porque necesita AI_API_KEY y la service role key de
// Supabase, ninguna de las dos puede vivir en el cliente móvil.
//
// El proveedor es intercambiable por configuración, sin tocar código:
// Secrets requeridos (supabase secrets set ...):
//   AI_API_KEY       - tu API key (OpenAI, DeepSeek, o cualquier endpoint compatible)
//   AI_BASE_URL       - opcional, default https://api.openai.com/v1
//                        (usa https://api.deepseek.com/v1 para DeepSeek)
//   AI_MODEL          - opcional, default gpt-4o-mini
//                        (usa deepseek-v4-flash para DeepSeek)
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY los inyecta
// automáticamente el runtime de Edge Functions.

import { createClient } from 'npm:@supabase/supabase-js@2';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const SKILLS = ['listening', 'speaking', 'reading', 'writing', 'vocabulary', 'grammar'];
const OBJECTIVES = ['meetings', 'emails', 'negotiation', 'presentations', 'customer_service', 'travel'];
// Máximo de veces que un estudiante puede generar un plan de curso por
// idioma: la primera vez (onboarding) + una "regeneración" gratis. Es la
// llamada a IA más grande de la app, así que este límite protege el costo
// sin dejar a nadie atrapado con un primer plan malo. Se cuenta directo
// sobre course_plans (cada generación, incluyendo las archivadas, inserta
// una fila nueva) — sin tabla nueva.
const MAX_COURSE_PLAN_GENERATIONS = 2;

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

interface BuildPromptArgs {
  occupation: string;
  industry: string;
  objectives: string[];
  targetLanguage: string;
  nativeLanguage: string;
  level: string;
}

function buildSystemPrompt(args: BuildPromptArgs): string {
  const languageNames: Record<string, string> = { en: 'inglés', es: 'español' };
  const targetLanguageName = languageNames[args.targetLanguage] ?? args.targetLanguage;
  const nativeLanguageName = languageNames[args.nativeLanguage] ?? args.nativeLanguage;

  return `Eres un diseñador curricular experto en enseñanza de idiomas para profesionales.
Generas planes de curso personalizados y accionables a partir del perfil de un estudiante.

Debes responder ÚNICAMENTE con un objeto JSON válido. Sin texto antes ni después,
sin markdown, sin explicaciones, sin comentarios. El JSON debe cumplir EXACTAMENTE
este esquema:

{
  "title": string,
  "summary": string,
  "estimated_weeks": integer,
  "modules": [
    {
      "order": integer,
      "title": string,
      "description": string,
      "skill_focus": "listening" | "speaking" | "reading" | "writing" | "vocabulary" | "grammar",
      "estimated_minutes": integer
    }
  ],
  "professional_vocabulary": [
    {
      "term": string,
      "translation": string,
      "example_sentence": string
    }
  ],
  "roleplay_scenarios": [
    {
      "title": string,
      "context": string,
      "objective": string,
      "related_objective": "meetings" | "emails" | "negotiation" | "presentations" | "customer_service" | "travel",
      "difficulty": "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
    }
  ],
  "guided_tasks": [
    {
      "title": string,
      "context": string,
      "objective": string,
      "related_objective": "meetings" | "emails" | "negotiation" | "presentations" | "customer_service" | "travel",
      "difficulty": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
      "steps": string[]
    }
  ]
}

Datos del estudiante:
- Ocupación: ${args.occupation}
- Industria: ${args.industry}
- Objetivos de aprendizaje: ${args.objectives.join(', ')}
- Idioma que aprende: ${targetLanguageName}
- Idioma nativo: ${nativeLanguageName}
- Nivel actual (CEFR): ${args.level}

Reglas de contenido:
1. Todo el contenido debe ser específico a la ocupación e industria indicadas. Evita
   vocabulario y escenarios genéricos que podrían aplicar a cualquier estudiante.
2. La dificultad del lenguaje usado dentro del vocabulario y los roleplays debe
   corresponder al nivel CEFR indicado — no uses estructuras más avanzadas que ese nivel.
3. Genera entre 5 y 8 módulos, en orden progresivo de dificultad.
4. Genera entre 15 y 20 términos de vocabulario.
5. Genera exactamente un escenario de roleplay por cada objetivo listado arriba
   (máximo 5 si hay más de 5 objetivos).
6. Los títulos y descripciones de los módulos, y el contexto/objetivo de los roleplays,
   van en ${nativeLanguageName}. "term" va en ${targetLanguageName} y "translation" en
   ${nativeLanguageName} (campos separados).
7. "example_sentence" debe contener ÚNICAMENTE la oración en ${targetLanguageName} —
   sin traducción entre paréntesis, sin la versión en ${nativeLanguageName} en ningún
   formato. Esta oración se usa tal cual para generar audio de voz; si mezclas idiomas
   ahí, el audio queda mal pronunciado.
8. No agregues campos fuera del esquema. No dejes arrays vacíos.
9. No repitas el mismo skill_focus en más de dos módulos consecutivos.
10. Genera exactamente 2 "guided_tasks": tareas profesionales realistas de la
    ocupación del estudiante, divididas en 5 a 7 pasos cada una (campo "steps").
    Cada paso es UNA instrucción corta y accionable en ${targetLanguageName}
    (ej. "Book a meeting room for 3pm tomorrow"), en el orden en que se
    ejecutarían de verdad. "title", "context" y "objective" van en
    ${nativeLanguageName} igual que en roleplay_scenarios; el array "steps" va
    ÚNICAMENTE en ${targetLanguageName}, porque el estudiante debe leerlos y
    responder ahí mismo.`;
}

interface GeneratedPlan {
  title: string;
  summary: string;
  estimated_weeks: number;
  modules: Array<{
    order: number;
    title: string;
    description: string;
    skill_focus: string;
    estimated_minutes: number;
  }>;
  professional_vocabulary: Array<{ term: string; translation: string; example_sentence: string }>;
  roleplay_scenarios: Array<{
    title: string;
    context: string;
    objective: string;
    related_objective: string;
    difficulty: string;
  }>;
  guided_tasks: Array<{
    title: string;
    context: string;
    objective: string;
    related_objective: string;
    difficulty: string;
    steps: string[];
  }>;
}

function validatePlan(plan: GeneratedPlan | null): string | null {
  if (!plan || typeof plan !== 'object') return 'la respuesta no es un objeto';
  if (typeof plan.title !== 'string' || !plan.title) return 'falta title';
  if (typeof plan.summary !== 'string' || !plan.summary) return 'falta summary';
  if (!Array.isArray(plan.modules) || plan.modules.length === 0) return 'falta modules';
  if (!Array.isArray(plan.professional_vocabulary) || plan.professional_vocabulary.length === 0) {
    return 'falta professional_vocabulary';
  }
  if (!Array.isArray(plan.roleplay_scenarios) || plan.roleplay_scenarios.length === 0) {
    return 'falta roleplay_scenarios';
  }

  for (const m of plan.modules) {
    if (typeof m.order !== 'number' || typeof m.title !== 'string' || !SKILLS.includes(m.skill_focus)) {
      return 'un módulo tiene formato inválido';
    }
  }
  for (const v of plan.professional_vocabulary) {
    if (typeof v.term !== 'string' || typeof v.translation !== 'string') {
      return 'un término de vocabulario tiene formato inválido';
    }
  }
  for (const r of plan.roleplay_scenarios) {
    if (
      typeof r.title !== 'string' ||
      !OBJECTIVES.includes(r.related_objective) ||
      !CEFR_LEVELS.includes(r.difficulty)
    ) {
      return 'un escenario de roleplay tiene formato inválido';
    }
  }

  if (!Array.isArray(plan.guided_tasks) || plan.guided_tasks.length === 0) {
    return 'falta guided_tasks';
  }
  for (const g of plan.guided_tasks) {
    if (
      typeof g.title !== 'string' ||
      !OBJECTIVES.includes(g.related_objective) ||
      !CEFR_LEVELS.includes(g.difficulty) ||
      !Array.isArray(g.steps) ||
      g.steps.length === 0 ||
      g.steps.some((s) => typeof s !== 'string' || !s)
    ) {
      return 'una tarea guiada tiene formato inválido';
    }
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

    // Cliente con el token del usuario: solo para confirmar quién es.
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

    // Cliente con service role: lecturas/escrituras que saltan RLS.
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: studentProfile, error: profileError } = await admin
      .from('student_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !studentProfile) {
      return jsonResponse({ error: 'No se encontró el perfil de estudiante.' }, 404);
    }

    if (!studentProfile.occupation || !studentProfile.industry || studentProfile.learning_objectives.length === 0) {
      return jsonResponse(
        { error: 'Completa ocupación, industria y objetivos en tu perfil antes de generar un plan.' },
        400
      );
    }

    const { count: generationCount } = await admin
      .from('course_plans')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('language', studentProfile.target_language);

    if ((generationCount ?? 0) >= MAX_COURSE_PLAN_GENERATIONS) {
      return jsonResponse(
        {
          error:
            'Ya generaste tu plan de curso el máximo de veces permitido. Habla con tu profesor si necesitas uno nuevo.',
        },
        403
      );
    }

    const { data: latestAssessment } = await admin
      .from('level_assessments')
      .select('overall_level')
      .eq('student_id', user.id)
      .eq('language', studentProfile.target_language)
      .order('taken_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const level = latestAssessment?.overall_level ?? studentProfile.proficiency_level;

    const systemPrompt = buildSystemPrompt({
      occupation: studentProfile.occupation,
      industry: studentProfile.industry,
      objectives: studentProfile.learning_objectives,
      targetLanguage: studentProfile.target_language,
      nativeLanguage: studentProfile.native_language,
      level,
    });

    // fetch directo al endpoint de chat completions (en vez del SDK de OpenAI):
    // el paquete npm:openai@4 tiene problemas de compatibilidad intermitentes
    // dentro del runtime Deno de Edge Functions ("Connection error." genérico).
    // Un fetch plano al mismo endpoint REST evita esa capa y funciona igual
    // para cualquier proveedor compatible con la API de OpenAI.
    const aiResponse = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: 'system', content: systemPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      return jsonResponse({ error: `Error del modelo (${aiResponse.status}): ${errorBody.slice(0, 500)}` }, 502);
    }

    const completion = await aiResponse.json();
    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      return jsonResponse({ error: 'El modelo no devolvió contenido.' }, 502);
    }

    let plan: GeneratedPlan;
    try {
      plan = JSON.parse(raw);
    } catch {
      return jsonResponse({ error: 'La respuesta del modelo no es JSON válido.' }, 502);
    }

    const validationError = validatePlan(plan);
    if (validationError) {
      return jsonResponse({ error: `Respuesta del modelo con formato inválido: ${validationError}` }, 502);
    }

    // Defensa extra: a veces el modelo mete la traducción entre paréntesis al
    // final de example_sentence a pesar de la instrucción. Ese campo se usa
    // tal cual para generar audio (shadowing), así que lo limpiamos aquí en
    // vez de solo confiar en el prompt.
    plan.professional_vocabulary = plan.professional_vocabulary.map((v) => ({
      ...v,
      example_sentence: v.example_sentence.replace(/\s*\([^)]*\)\s*$/, '').trim(),
    }));

    // course_plans solo permite un plan "active" por estudiante/idioma
    // (índice único parcial) — archiva el anterior antes de insertar el nuevo.
    await admin
      .from('course_plans')
      .update({ status: 'archived' })
      .eq('student_id', user.id)
      .eq('language', studentProfile.target_language)
      .eq('status', 'active');

    const { data: coursePlan, error: planError } = await admin
      .from('course_plans')
      .insert({
        student_id: user.id,
        language: studentProfile.target_language,
        level_at_generation: level,
        status: 'active',
        title: plan.title,
        summary: plan.summary,
        generated_by: 'ai',
      })
      .select()
      .single();

    if (planError || !coursePlan) {
      return jsonResponse({ error: planError?.message ?? 'No se pudo crear el plan de curso.' }, 500);
    }

    const items = plan.modules.map((m) => ({
      course_plan_id: coursePlan.id,
      order_index: m.order,
      title: m.title,
      description: m.description,
      skill_focus: m.skill_focus,
      estimated_minutes: m.estimated_minutes,
    }));

    const vocabulary = plan.professional_vocabulary.map((v) => ({
      course_plan_id: coursePlan.id,
      term: v.term,
      translation: v.translation,
      example_sentence: v.example_sentence,
    }));

    const roleplays = [
      ...plan.roleplay_scenarios.map((r) => ({
        course_plan_id: coursePlan.id,
        title: r.title,
        context: r.context,
        objective: r.objective,
        related_objective: r.related_objective,
        difficulty: r.difficulty,
        activity_type: 'conversation',
      })),
      ...plan.guided_tasks.map((g) => ({
        course_plan_id: coursePlan.id,
        title: g.title,
        context: g.context,
        objective: g.objective,
        related_objective: g.related_objective,
        difficulty: g.difficulty,
        activity_type: 'guided_task',
        steps: g.steps,
      })),
    ];

    const [itemsResult, vocabResult, roleplaysResult] = await Promise.all([
      admin.from('course_plan_items').insert(items).select(),
      admin.from('course_plan_vocabulary').insert(vocabulary).select(),
      admin.from('course_plan_roleplays').insert(roleplays).select(),
    ]);

    if (itemsResult.error || vocabResult.error || roleplaysResult.error) {
      return jsonResponse(
        {
          error:
            itemsResult.error?.message ?? vocabResult.error?.message ?? roleplaysResult.error?.message,
        },
        500
      );
    }

    return jsonResponse({
      coursePlan,
      modules: itemsResult.data,
      vocabulary: vocabResult.data,
      roleplays: roleplaysResult.data,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
