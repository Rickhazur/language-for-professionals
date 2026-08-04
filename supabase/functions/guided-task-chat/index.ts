// Supabase Edge Function: "Seguir instrucciones" — segunda modalidad de
// Roleplay (además de la conversación libre). La IA generó la tarea y sus
// pasos en generate-course-plan (course_plan_roleplays.activity_type =
// 'guided_task'); esta función conduce el intento paso a paso:
//   start   -> crea el intento y devuelve el primer paso
//   respond -> guarda la respuesta del estudiante a un paso, la IA la
//              juzga correcta/incorrecta con feedback breve, y devuelve el
//              siguiente paso (o cierra el intento si era el último)
//
// Reutiliza el mismo proveedor de IA configurable que generate-course-plan
// y roleplay-chat (AI_API_KEY / AI_BASE_URL / AI_MODEL).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { recordActivityAndAwardPoints } from '../_shared/gamification.ts';
import { checkQuota, logUsage } from '../_shared/quota.ts';

const POINTS_PER_TASK = 15;
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

async function judgeStep(
  aiBaseUrl: string,
  aiApiKey: string,
  aiModel: string,
  args: {
    title: string;
    context: string;
    targetLanguageName: string;
    difficulty: string;
    instruction: string;
    studentResponse: string;
  }
): Promise<{ correct: boolean; feedback: string }> {
  const prompt = `Eres el evaluador de una tarea guiada de práctica de idioma para un
estudiante profesional.

Escenario: ${args.title}
Contexto: ${args.context}
Nivel del estudiante (CEFR): ${args.difficulty}

El estudiante debía seguir esta instrucción en ${args.targetLanguageName}:
"${args.instruction}"

Esto fue lo que el estudiante respondió:
"${args.studentResponse}"

Evalúa si la respuesta del estudiante cumple razonablemente la instrucción (no exijas
palabras exactas, evalúa la intención y que el ${args.targetLanguageName} sea
comprensible y apropiado para el nivel indicado). Responde ÚNICAMENTE con un objeto
JSON con este esquema exacto:

{
  "correct": boolean,
  "feedback": string
}

"feedback" es 1-2 frases en español, directas y específicas: si fue correcto, di
brevemente por qué funciona; si no, di qué faltó o qué error tiene y cómo se vería
una respuesta correcta. No uses markdown.`;

  const response = await fetch(`${aiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiApiKey}` },
    body: JSON.stringify({
      model: aiModel,
      messages: [{ role: 'system', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error del modelo (${response.status}): ${errorBody.slice(0, 500)}`);
  }

  const completion = await response.json();
  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) throw new Error('El modelo no devolvió contenido.');

  const parsed = JSON.parse(raw);
  if (typeof parsed.correct !== 'boolean' || typeof parsed.feedback !== 'string') {
    throw new Error('La evaluación del modelo tiene formato inválido.');
  }
  return { correct: parsed.correct, feedback: parsed.feedback };
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
    const action = body?.action;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // ── start: crea el intento y devuelve el primer paso ──
    if (action === 'start') {
      const roleplayId = typeof body?.roleplayId === 'string' ? body.roleplayId : '';
      if (!roleplayId) return jsonResponse({ error: 'Falta "roleplayId".' }, 400);

      const { data: task } = await admin
        .from('course_plan_roleplays')
        .select('*, course_plans!inner(student_id, language)')
        .eq('id', roleplayId)
        .eq('activity_type', 'guided_task')
        .maybeSingle();

      const coursePlan = task?.course_plans;
      if (!task || !coursePlan || coursePlan.student_id !== user.id) {
        return jsonResponse({ error: 'Tarea no encontrada.' }, 404);
      }

      const steps: string[] = Array.isArray(task.steps) ? task.steps : [];
      if (steps.length === 0) {
        return jsonResponse({ error: 'Esta tarea no tiene pasos configurados.' }, 500);
      }

      const { data: studentProfile } = await admin
        .from('student_profiles')
        .select('target_language')
        .eq('id', user.id)
        .single();

      const targetLanguage = studentProfile?.target_language ?? coursePlan.language;

      const quota = await checkQuota(admin, user.id);
      if (!quota.allowed) return jsonResponse({ error: quota.message }, 403);

      const { data: attempt, error: attemptError } = await admin
        .from('guided_task_attempts')
        .insert({
          student_id: user.id,
          roleplay_id: roleplayId,
          language: targetLanguage,
          total_steps: steps.length,
        })
        .select()
        .single();

      if (attemptError || !attempt) {
        return jsonResponse({ error: attemptError?.message ?? 'No se pudo iniciar la tarea.' }, 500);
      }

      return jsonResponse({ attempt, task, instruction: steps[0] });
    }

    // ── respond: evalúa la respuesta a un paso y avanza al siguiente ──
    if (action === 'respond') {
      const attemptId = typeof body?.attemptId === 'string' ? body.attemptId : '';
      const studentResponse = typeof body?.response === 'string' ? body.response.trim() : '';

      if (!attemptId) return jsonResponse({ error: 'Falta "attemptId".' }, 400);
      if (!studentResponse) return jsonResponse({ error: 'Falta "response".' }, 400);

      const { data: attempt } = await admin
        .from('guided_task_attempts')
        .select('*, course_plan_roleplays!inner(title, context, objective, difficulty, steps)')
        .eq('id', attemptId)
        .maybeSingle();

      if (!attempt || attempt.student_id !== user.id) {
        return jsonResponse({ error: 'Intento no encontrado.' }, 404);
      }
      if (attempt.status !== 'active') {
        return jsonResponse({ error: 'Esta tarea ya terminó.' }, 400);
      }

      const task = attempt.course_plan_roleplays;
      const steps: string[] = Array.isArray(task.steps) ? task.steps : [];
      const stepIndex = attempt.current_step;
      const instruction = steps[stepIndex];

      if (!instruction) {
        return jsonResponse({ error: 'No se encontró el paso actual.' }, 500);
      }

      const targetLanguageName = LANGUAGE_NAMES[attempt.language] ?? attempt.language;

      const judgment = await judgeStep(aiBaseUrl, aiApiKey, aiModel, {
        title: task.title,
        context: task.context,
        targetLanguageName,
        difficulty: task.difficulty,
        instruction,
        studentResponse,
      });

      const stepResult = {
        step_index: stepIndex,
        instruction,
        response: studentResponse,
        correct: judgment.correct,
        feedback: judgment.feedback,
      };

      const updatedResults = [...(Array.isArray(attempt.step_results) ? attempt.step_results : []), stepResult];
      const isLastStep = stepIndex + 1 >= steps.length;

      if (isLastStep) {
        const score = updatedResults.filter((r: { correct: boolean }) => r.correct).length;

        const { data: updatedAttempt, error: updateError } = await admin
          .from('guided_task_attempts')
          .update({
            current_step: stepIndex + 1,
            step_results: updatedResults,
            status: 'completed',
            score,
            completed_at: new Date().toISOString(),
          })
          .eq('id', attemptId)
          .select()
          .single();

        if (updateError || !updatedAttempt) {
          return jsonResponse({ error: updateError?.message ?? 'No se pudo guardar tu progreso.' }, 500);
        }

        try {
          await logUsage(admin, user.id, 'roleplay');
        } catch (quotaError) {
          console.error('logUsage failed:', quotaError);
        }

        let gamification = null;
        let newBadges: unknown[] = [];
        try {
          const result = await recordActivityAndAwardPoints(admin, user.id, POINTS_PER_TASK);
          gamification = {
            totalPoints: result.totalPoints,
            currentStreak: result.currentStreak,
            longestStreak: result.longestStreak,
          };
          newBadges = result.newBadges;
        } catch (gamificationError) {
          console.error('gamification update failed:', gamificationError);
        }

        return jsonResponse({
          attempt: updatedAttempt,
          stepResult,
          finished: true,
          gamification,
          newBadges,
        });
      }

      const { data: updatedAttempt, error: updateError } = await admin
        .from('guided_task_attempts')
        .update({ current_step: stepIndex + 1, step_results: updatedResults })
        .eq('id', attemptId)
        .select()
        .single();

      if (updateError || !updatedAttempt) {
        return jsonResponse({ error: updateError?.message ?? 'No se pudo guardar tu progreso.' }, 500);
      }

      return jsonResponse({
        attempt: updatedAttempt,
        stepResult,
        finished: false,
        instruction: steps[stepIndex + 1],
      });
    }

    return jsonResponse({ error: `Acción desconocida: ${action}` }, 400);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
