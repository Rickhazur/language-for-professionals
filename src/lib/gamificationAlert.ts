import { GamificationUpdate, StudentBadge } from '../types/database';

export function buildGamificationMessage(
  gamification: GamificationUpdate | null,
  newBadges: Pick<StudentBadge, 'icon' | 'title'>[]
): string | null {
  if (!gamification) return null;

  const lines = [`🔥 Racha: ${gamification.currentStreak} día(s)`, `⭐ Puntos totales: ${gamification.totalPoints}`];

  if (newBadges.length > 0) {
    lines.push('', '¡Nueva(s) insignia(s)!');
    for (const badge of newBadges) {
      lines.push(`${badge.icon} ${badge.title}`);
    }
  }

  return lines.join('\n');
}
