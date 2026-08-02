// Lógica de gamificación compartida entre finalize-practice-session (rachas
// + puntos por sesión) y assess-pronunciation (puntos por intento + insignia
// de dominio de fonema). Vive en _shared para no duplicarla entre funciones.

import { createClient } from 'npm:@supabase/supabase-js@2';

type AdminClient = ReturnType<typeof createClient>;

export interface BadgeAward {
  badge_type: string;
  badge_key: string;
  title: string;
  description: string;
  icon: string;
}

const STREAK_MILESTONES = [
  { days: 3, title: 'Racha de 3 días', description: 'Practicaste 3 días seguidos.', icon: '🔥' },
  { days: 7, title: 'Racha de 7 días', description: 'Una semana completa practicando.', icon: '🔥' },
  { days: 14, title: 'Racha de 14 días', description: 'Dos semanas seguidas, ¡impresionante!', icon: '🔥' },
  { days: 30, title: 'Racha de 30 días', description: 'Un mes entero sin fallar un día.', icon: '🏆' },
];

const POINTS_MILESTONES = [
  { points: 50, title: '50 puntos', description: 'Alcanzaste 50 puntos.', icon: '⭐' },
  { points: 100, title: '100 puntos', description: 'Alcanzaste 100 puntos.', icon: '⭐' },
  { points: 500, title: '500 puntos', description: 'Alcanzaste 500 puntos.', icon: '🌟' },
  { points: 1000, title: '1000 puntos', description: 'Alcanzaste 1000 puntos, ¡nivel experto!', icon: '💎' },
];

const MASTERY_WINDOW = 5;
const MASTERY_THRESHOLD = 90;

async function awardBadgeIfNew(admin: AdminClient, studentId: string, award: BadgeAward): Promise<BadgeAward | null> {
  const { data, error } = await admin
    .from('student_badges')
    .insert({
      student_id: studentId,
      badge_type: award.badge_type,
      badge_key: award.badge_key,
      title: award.title,
      description: award.description,
      icon: award.icon,
    })
    .select()
    .maybeSingle();

  // Código 23505 = unique_violation: la insignia ya se había otorgado antes,
  // no es un error real, solo significa que no hay nada nuevo que devolver.
  if (error) {
    if ((error as { code?: string }).code === '23505') return null;
    console.error('awardBadgeIfNew failed:', error);
    return null;
  }

  return data ? award : null;
}

// Registra actividad de hoy (recalcula racha) y suma puntos. Se llama una
// vez por acción que "cuenta" como práctica (terminar una sesión, analizar
// un intento) — idempotente en cuanto a insignias, no en cuanto a puntos
// (cada llamada suma los puntos que le pasen).
export async function recordActivityAndAwardPoints(
  admin: AdminClient,
  studentId: string,
  pointsToAdd: number
): Promise<{ totalPoints: number; currentStreak: number; longestStreak: number; newBadges: BadgeAward[] }> {
  const today = new Date().toISOString().slice(0, 10);
  const newBadges: BadgeAward[] = [];

  const { data: existing } = await admin
    .from('student_gamification')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  let currentStreak = existing?.current_streak ?? 0;
  const lastDate = existing?.last_activity_date as string | null | undefined;

  if (!lastDate) {
    currentStreak = 1;
  } else if (lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    currentStreak = lastDate === yesterday ? currentStreak + 1 : 1;
  }
  const longestStreak = Math.max(existing?.longest_streak ?? 0, currentStreak);
  const totalPoints = (existing?.total_points ?? 0) + pointsToAdd;

  await admin.from('student_gamification').upsert(
    {
      student_id: studentId,
      total_points: totalPoints,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'student_id' }
  );

  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak >= milestone.days) {
      const badge = await awardBadgeIfNew(admin, studentId, {
        badge_type: 'streak',
        badge_key: `streak_${milestone.days}`,
        title: milestone.title,
        description: milestone.description,
        icon: milestone.icon,
      });
      if (badge) newBadges.push(badge);
    }
  }

  for (const milestone of POINTS_MILESTONES) {
    if (totalPoints >= milestone.points) {
      const badge = await awardBadgeIfNew(admin, studentId, {
        badge_type: 'points',
        badge_key: `points_${milestone.points}`,
        title: milestone.title,
        description: milestone.description,
        icon: milestone.icon,
      });
      if (badge) newBadges.push(badge);
    }
  }

  return { totalPoints, currentStreak, longestStreak, newBadges };
}

// Insignia de dominio de un fonema específico: los últimos MASTERY_WINDOW
// intentos de ese fonema deben estar TODOS por encima de MASTERY_THRESHOLD.
// scores debe venir ordenado del más reciente al más viejo (mismo orden que
// ya usa refreshPhonemeWeakness en assess-pronunciation, así se reutiliza la
// misma consulta para ambas cosas).
export async function checkPhonemeMastery(
  admin: AdminClient,
  studentId: string,
  phoneme: string,
  recentScoresDesc: number[]
): Promise<BadgeAward | null> {
  if (recentScoresDesc.length < MASTERY_WINDOW) return null;
  const window = recentScoresDesc.slice(0, MASTERY_WINDOW);
  const allMastered = window.every((s) => s >= MASTERY_THRESHOLD);
  if (!allMastered) return null;

  return awardBadgeIfNew(admin, studentId, {
    badge_type: 'phoneme_mastery',
    badge_key: phoneme,
    title: `Dominaste el sonido /${phoneme}/`,
    description: `Tus últimos ${MASTERY_WINDOW} intentos con /${phoneme}/ superaron ${MASTERY_THRESHOLD} puntos.`,
    icon: '🎯',
  });
}
