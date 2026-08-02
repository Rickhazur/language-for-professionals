export function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'var(--color-text-muted)';
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export function scoreBackground(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'var(--color-surface)';
  if (score >= 80) return '#DCFCE7';
  if (score >= 60) return '#FEF3C7';
  return '#FEE2E2';
}
