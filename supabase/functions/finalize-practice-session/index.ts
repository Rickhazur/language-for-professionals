// Supabase Edge Function: cierra una sesión de práctica (duración, notas,
// ended_at) y otorga puntos + actualiza la racha diaria del estudiante.
// Reemplaza el UPDATE directo que hacía el cliente, para que la lógica de
// puntos/racha/insignias viva en un solo lugar server-side.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { recordActivityAndAwardPoints } from '../_shared/gamification.ts';

const POINTS_PER_SESSION = 10;

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
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
    const durationMinutes = typeof body?.durationMinutes === 'number' ? body.durationMinutes : null;
    const notes = typeof body?.notes === 'string' ? body.notes : null;

    if (!sessionId) {
      return jsonResponse({ error: 'Falta "sessionId".' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: existingSession } = await admin
      .from('practice_sessions')
      .select('id, student_id')
      .eq('id', sessionId)
      .maybeSingle();

    if (!existingSession || existingSession.student_id !== user.id) {
      return jsonResponse({ error: 'Sesión no encontrada.' }, 404);
    }

    const { data: session, error: updateError } = await admin
      .from('practice_sessions')
      .update({
        duration_minutes: durationMinutes,
        notes,
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError || !session) {
      return jsonResponse({ error: updateError?.message ?? 'No se pudo cerrar la sesión.' }, 500);
    }

    let gamification: { totalPoints: number; currentStreak: number; longestStreak: number } | null = null;
    let newBadges: Awaited<ReturnType<typeof recordActivityAndAwardPoints>>['newBadges'] = [];

    try {
      const result = await recordActivityAndAwardPoints(admin, user.id, POINTS_PER_SESSION);
      gamification = {
        totalPoints: result.totalPoints,
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
      };
      newBadges = result.newBadges;
    } catch (gamificationError) {
      console.error('gamification update failed:', gamificationError);
    }

    return jsonResponse({ session, gamification, newBadges });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
