import { Plan, StudentPlan } from '../types/database';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface PlanUsageSummary {
  totalUsed: number;
  totalLimit: number | null;
  weeklyUsed: number;
  weeklyLimit: number | null;
  weeksRemaining: number | null;
}

// Mismo cálculo de bloques semanales que supabase/functions/_shared/quota.ts
// (bloques fijos desde started_at, no semana de calendario) — para que lo
// que ve el profesor coincida con lo que realmente bloquea al estudiante.
export function summarizePlanUsage(studentPlan: StudentPlan, plan: Plan, usageCreatedAt: string[]): PlanUsageSummary {
  const startedAt = new Date(studentPlan.started_at).getTime();
  const currentWeekNumber = Math.floor((Date.now() - startedAt) / WEEK_MS);
  const weekStart = startedAt + currentWeekNumber * WEEK_MS;
  const weekEnd = startedAt + (currentWeekNumber + 1) * WEEK_MS;

  const weeklyUsed = usageCreatedAt.filter((ts) => {
    const t = new Date(ts).getTime();
    return t >= weekStart && t < weekEnd;
  }).length;

  return {
    totalUsed: usageCreatedAt.length,
    totalLimit: plan.total_sessions,
    weeklyUsed,
    weeklyLimit: plan.weekly_session_limit,
    weeksRemaining: plan.duration_weeks !== null ? Math.max(0, plan.duration_weeks - (currentWeekNumber + 1)) : null,
  };
}

export function formatPlanTag(planName: string, usage: PlanUsageSummary): string {
  if (usage.totalLimit === null) return `${planName} · ${usage.totalUsed} usadas`;
  return `${planName} · ${usage.totalUsed}/${usage.totalLimit}`;
}
