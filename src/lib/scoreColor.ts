import { colors } from '../constants/theme';

export function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return colors.textMuted;
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.secondary;
  return colors.error;
}

export function scoreBackground(score: number | null | undefined): string {
  if (score === null || score === undefined) return colors.surface;
  if (score >= 80) return '#DCFCE7';
  if (score >= 60) return '#FEF3C7';
  return '#FEE2E2';
}
