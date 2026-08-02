// Cupo de sesiones de práctica por plan (Diagnostic / Momentum / Full
// Program / Ongoing). checkQuota se llama antes de dejar que el estudiante
// empiece o consuma una práctica que cuenta contra su plan; logUsage se
// llama después de que esa práctica termina con éxito. Sin plan activo
// asignado, checkQuota siempre permite (mismo criterio que el rollout de
// is_approved: no bloquear cuentas existentes de golpe).

import { createClient } from 'npm:@supabase/supabase-js@2';

type AdminClient = ReturnType<typeof createClient>;

export type QuotaSessionType = 'roleplay' | 'lesson' | 'shadowing';

export type QuotaResult = { allowed: true } | { allowed: false; message: string };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function getActiveStudentPlan(admin: AdminClient, studentId: string) {
  const { data } = await admin
    .from('student_plans')
    .select('id, started_at, plans(total_sessions, weekly_session_limit)')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle();
  return data as
    | { id: string; started_at: string; plans: { total_sessions: number | null; weekly_session_limit: number | null } }
    | null;
}

export async function checkQuota(admin: AdminClient, studentId: string): Promise<QuotaResult> {
  const studentPlan = await getActiveStudentPlan(admin, studentId);
  if (!studentPlan) return { allowed: true };

  const { total_sessions, weekly_session_limit } = studentPlan.plans;

  if (total_sessions !== null) {
    const { count } = await admin
      .from('app_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('student_plan_id', studentPlan.id);

    if ((count ?? 0) >= total_sessions) {
      return {
        allowed: false,
        message: 'Ya usaste todas las sesiones de práctica de tu plan. Habla con tu profesor para renovar o subir de paquete.',
      };
    }
  }

  if (weekly_session_limit !== null) {
    const startedAt = new Date(studentPlan.started_at).getTime();
    const weekNumber = Math.floor((Date.now() - startedAt) / WEEK_MS);
    const weekStart = new Date(startedAt + weekNumber * WEEK_MS).toISOString();
    const weekEnd = new Date(startedAt + (weekNumber + 1) * WEEK_MS).toISOString();

    const { count } = await admin
      .from('app_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('student_plan_id', studentPlan.id)
      .gte('created_at', weekStart)
      .lt('created_at', weekEnd);

    if ((count ?? 0) >= weekly_session_limit) {
      return {
        allowed: false,
        message: 'Ya usaste tus sesiones de práctica de esta semana. Vuelven a estar disponibles en unos días.',
      };
    }
  }

  return { allowed: true };
}

export async function logUsage(admin: AdminClient, studentId: string, sessionType: QuotaSessionType): Promise<void> {
  const { data: studentPlan } = await admin
    .from('student_plans')
    .select('id')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (!studentPlan) return;

  await admin.from('app_usage_log').insert({
    student_id: studentId,
    student_plan_id: studentPlan.id,
    session_type: sessionType,
  });
}
