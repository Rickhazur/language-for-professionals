// Supabase Edge Function: asigna (o cambia) el paquete/plan de un
// estudiante. Solo puede llamarla un profesor ya aprobado — se verifica a
// mano porque usa la service role key, que salta RLS. Asignar un plan nuevo
// desactiva el anterior, lo que reinicia el cupo total y semanal (los
// registros de app_usage_log quedan atados al student_plan_id anterior).

import { createClient } from 'npm:@supabase/supabase-js@2';

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
    const studentId = typeof body?.studentId === 'string' ? body.studentId : '';
    const planId = typeof body?.planId === 'string' ? body.planId : '';

    if (!studentId || !planId) {
      return jsonResponse({ error: 'Faltan "studentId" o "planId".' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: caller } = await admin
      .from('profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .maybeSingle();

    if (!caller || caller.role !== 'teacher' || !caller.is_approved) {
      return jsonResponse({ error: 'Solo un profesor ya aprobado puede asignar planes.' }, 403);
    }

    const { data: plan } = await admin.from('plans').select('id').eq('id', planId).maybeSingle();
    if (!plan) {
      return jsonResponse({ error: 'Plan no encontrado.' }, 404);
    }

    const { data: student } = await admin.from('profiles').select('id, role').eq('id', studentId).maybeSingle();
    if (!student || student.role !== 'student') {
      return jsonResponse({ error: 'Estudiante no encontrado.' }, 404);
    }

    await admin.from('student_plans').update({ is_active: false }).eq('student_id', studentId).eq('is_active', true);

    const { data: studentPlan, error: insertError } = await admin
      .from('student_plans')
      .insert({ student_id: studentId, plan_id: planId, assigned_by: user.id })
      .select()
      .single();

    if (insertError || !studentPlan) {
      return jsonResponse({ error: insertError?.message ?? 'No se pudo asignar el plan.' }, 500);
    }

    return jsonResponse({ studentPlan });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
