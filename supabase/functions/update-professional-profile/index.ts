// Supabase Edge Function: permite a un estudiante editar su ocupación,
// industria y objetivos de aprendizaje DESPUÉS del onboarding inicial, con
// un tope de 2 ediciones — mismo criterio que MAX_COURSE_PLAN_GENERATIONS
// en generate-course-plan (proteger de reintentos ilimitados sin bloquear
// del todo un ajuste de perfil legítimo).
//
// Vive server-side (con service role) para poder incrementar
// profile_edit_count de forma atómica y confiable, sin depender de que el
// cliente lea-antes-de-escribir correctamente.

import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_PROFILE_EDITS = 2;
const OBJECTIVES = ['meetings', 'emails', 'negotiation', 'presentations', 'customer_service', 'travel'];

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
    const occupation = typeof body?.occupation === 'string' ? body.occupation.trim() : '';
    const industry = typeof body?.industry === 'string' ? body.industry.trim() : '';
    const objectives = Array.isArray(body?.objectives)
      ? body.objectives.filter((o: unknown) => typeof o === 'string' && OBJECTIVES.includes(o))
      : [];

    if (!occupation || !industry || objectives.length === 0) {
      return jsonResponse({ error: 'Completa ocupación, industria y al menos un objetivo.' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: studentProfile, error: profileError } = await admin
      .from('student_profiles')
      .select('profile_edit_count')
      .eq('id', user.id)
      .single();

    if (profileError || !studentProfile) {
      return jsonResponse({ error: 'No se encontró el perfil de estudiante.' }, 404);
    }

    if (studentProfile.profile_edit_count >= MAX_PROFILE_EDITS) {
      return jsonResponse(
        {
          error:
            'Ya editaste tu perfil el máximo de veces permitido. Habla con tu profesor si necesitas otro cambio.',
        },
        403
      );
    }

    const { data: updated, error: updateError } = await admin
      .from('student_profiles')
      .update({
        occupation,
        industry,
        learning_objectives: objectives,
        profile_edit_count: studentProfile.profile_edit_count + 1,
      })
      .eq('id', user.id)
      .select('occupation, industry, learning_objectives, profile_edit_count')
      .single();

    if (updateError || !updated) {
      return jsonResponse({ error: updateError?.message ?? 'No se pudo actualizar el perfil.' }, 500);
    }

    return jsonResponse({ profile: updated });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
