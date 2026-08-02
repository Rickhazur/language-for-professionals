// Supabase Edge Function: cierra un intento de lección (quiz/speaking/
// writing/vocabulary), marca el módulo como completado, otorga puntos y
// revisa insignias de hitos de lecciones. Para writing, además genera el
// feedback de la IA sobre el texto del estudiante (no se cachea — es por
// intento, no por módulo).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { recordActivityAndAwardPoints, checkLessonMilestones } from '../_shared/gamification.ts';
import { logUsage } from '../_shared/quota.ts';

const POINTS_PER_LESSON = 15;
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
    const score = typeof body?.score === 'number' ? body.score : null;
    const responses = typeof body?.responses === 'object' && body?.responses !== null ? body.responses : {};

    if (!coursePlanItemId) {
      return jsonResponse({ error: 'Falta "coursePlanItemId".' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: item } = await admin
      .from('course_plan_items')
      .select('id, course_plan_id, title, description, skill_focus, status')
      .eq('id', coursePlanItemId)
      .maybeSingle();

    if (!item) {
      return jsonResponse({ error: 'Módulo no encontrado.' }, 404);
    }

    const { data: plan } = await admin
      .from('course_plans')
      .select('student_id')
      .eq('id', item.course_plan_id)
      .maybeSingle();

    if (!plan || plan.student_id !== user.id) {
      return jsonResponse({ error: 'Este módulo no pertenece a tu plan de curso.' }, 403);
    }

    let finalResponses = responses as Record<string, unknown>;

    if (item.skill_focus === 'writing') {
      const studentText = typeof finalResponses.text === 'string' ? finalResponses.text.trim() : '';
      if (!studentText) {
        return jsonResponse({ error: 'Falta el texto escrito por el estudiante.' }, 400);
      }

      if (!aiApiKey) {
        return jsonResponse({ error: 'AI_API_KEY no está configurada en los secrets de la función.' }, 500);
      }

      const { data: studentProfile } = await admin
        .from('student_profiles')
        .select('target_language')
        .eq('id', user.id)
        .single();
      const targetName = LANGUAGE_NAMES[studentProfile?.target_language ?? ''] ?? studentProfile?.target_language ?? '';

      const feedbackPrompt = `Eres un profesor de ${targetName} para profesionales. Un estudiante completó
un ejercicio de escritura para el módulo "${item.title}"${item.description ? ` (${item.description})` : ''}.

Texto que escribió el estudiante:
"""
${studentText}
"""

Escribe retroalimentación breve (3 a 5 frases) en español, en tono alentador pero
honesto: qué hizo bien, y 1-2 cosas concretas para mejorar (gramática, claridad,
tono profesional). No reescribas el texto completo por él. No uses markdown, solo
texto plano.`;

      const aiResponse = await fetch(`${aiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiApiKey}` },
        body: JSON.stringify({
          model: aiModel,
          messages: [{ role: 'system', content: feedbackPrompt }],
          temperature: 0.5,
        }),
      });

      if (!aiResponse.ok) {
        const errorBody = await aiResponse.text();
        return jsonResponse({ error: `Error del modelo (${aiResponse.status}): ${errorBody.slice(0, 500)}` }, 502);
      }

      const completion = await aiResponse.json();
      const feedback = completion.choices?.[0]?.message?.content?.trim();
      if (!feedback) {
        return jsonResponse({ error: 'El modelo no devolvió contenido.' }, 502);
      }

      finalResponses = { ...finalResponses, feedback };
    }

    const { data: attempt, error: attemptError } = await admin
      .from('course_plan_item_attempts')
      .insert({
        course_plan_item_id: coursePlanItemId,
        student_id: user.id,
        score,
        responses: finalResponses,
      })
      .select()
      .single();

    if (attemptError || !attempt) {
      return jsonResponse({ error: attemptError?.message ?? 'No se pudo guardar el intento.' }, 500);
    }

    const wasAlreadyCompleted = item.status === 'completed';

    await admin.from('course_plan_items').update({ status: 'completed' }).eq('id', coursePlanItemId);

    if (!wasAlreadyCompleted) {
      try {
        await logUsage(admin, user.id, 'lesson');
      } catch (quotaError) {
        console.error('logUsage failed:', quotaError);
      }
    }

    let gamification: { totalPoints: number; currentStreak: number; longestStreak: number } | null = null;
    let newBadges: Awaited<ReturnType<typeof recordActivityAndAwardPoints>>['newBadges'] = [];

    try {
      const result = await recordActivityAndAwardPoints(admin, user.id, POINTS_PER_LESSON);
      gamification = {
        totalPoints: result.totalPoints,
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
      };
      newBadges = result.newBadges;

      const { data: studentPlans } = await admin.from('course_plans').select('id').eq('student_id', user.id);
      const planIds = (studentPlans ?? []).map((p) => p.id);
      const { count } = await admin
        .from('course_plan_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .in('course_plan_id', planIds.length > 0 ? planIds : ['00000000-0000-0000-0000-000000000000']);

      const milestoneBadges = await checkLessonMilestones(admin, user.id, count ?? 0);
      newBadges = [...newBadges, ...milestoneBadges];
    } catch (gamificationError) {
      console.error('gamification update failed:', gamificationError);
    }

    return jsonResponse({ attempt, gamification, newBadges });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
