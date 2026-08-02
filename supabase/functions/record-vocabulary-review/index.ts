// Supabase Edge Function: registra el resultado de un repaso de vocabulario
// (Leitner) y avanza/resetea la caja del término server-side — el cliente
// nunca reporta su propia caja, para que no se pueda auto-otorgar progreso.
// También suma puntos y revisa insignias de hitos de vocabulario dominado.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { recordActivityAndAwardPoints, checkVocabularyMilestones } from '../_shared/gamification.ts';

const POINTS_PER_REVIEW = 2;
const MAX_BOX = 5;
const BOX_INTERVALS_DAYS = [1, 2, 4, 9, 20]; // índice 0 = caja 1

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
    const vocabularyId = typeof body?.vocabularyId === 'string' ? body.vocabularyId : '';
    const correct = typeof body?.correct === 'boolean' ? body.correct : null;

    if (!vocabularyId) {
      return jsonResponse({ error: 'Falta "vocabularyId".' }, 400);
    }
    if (correct === null) {
      return jsonResponse({ error: 'Falta "correct".' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Verifica que el término pertenezca a un plan de curso del propio usuario.
    const { data: vocabRow } = await admin
      .from('course_plan_vocabulary')
      .select('id, course_plan_id')
      .eq('id', vocabularyId)
      .maybeSingle();

    if (!vocabRow) {
      return jsonResponse({ error: 'Término de vocabulario no encontrado.' }, 404);
    }

    const { data: planRow } = await admin
      .from('course_plans')
      .select('student_id')
      .eq('id', vocabRow.course_plan_id)
      .maybeSingle();

    if (!planRow || planRow.student_id !== user.id) {
      return jsonResponse({ error: 'Este término no pertenece a tu plan de curso.' }, 403);
    }

    const { data: existing } = await admin
      .from('student_vocabulary_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('vocabulary_id', vocabularyId)
      .maybeSingle();

    const currentBox = existing?.box ?? 1;
    const newBox = correct ? Math.min(MAX_BOX, currentBox + 1) : 1;
    const intervalDays = BOX_INTERVALS_DAYS[newBox - 1];
    const now = new Date();
    const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    const { data: progress, error: upsertError } = await admin
      .from('student_vocabulary_progress')
      .upsert(
        {
          student_id: user.id,
          vocabulary_id: vocabularyId,
          box: newBox,
          correct_count: (existing?.correct_count ?? 0) + (correct ? 1 : 0),
          incorrect_count: (existing?.incorrect_count ?? 0) + (correct ? 0 : 1),
          last_reviewed_at: now.toISOString(),
          next_review_at: nextReviewAt.toISOString(),
        },
        { onConflict: 'student_id,vocabulary_id' }
      )
      .select()
      .single();

    if (upsertError || !progress) {
      return jsonResponse({ error: upsertError?.message ?? 'No se pudo guardar el progreso.' }, 500);
    }

    let gamification: { totalPoints: number; currentStreak: number; longestStreak: number } | null = null;
    let newBadges: Awaited<ReturnType<typeof recordActivityAndAwardPoints>>['newBadges'] = [];

    try {
      const result = await recordActivityAndAwardPoints(admin, user.id, POINTS_PER_REVIEW);
      gamification = {
        totalPoints: result.totalPoints,
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
      };
      newBadges = result.newBadges;

      if (newBox >= MAX_BOX) {
        const { count } = await admin
          .from('student_vocabulary_progress')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('box', MAX_BOX);

        const milestoneBadges = await checkVocabularyMilestones(admin, user.id, count ?? 0);
        newBadges = [...newBadges, ...milestoneBadges];
      }
    } catch (gamificationError) {
      console.error('gamification update failed:', gamificationError);
    }

    return jsonResponse({ progress, gamification, newBadges });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
