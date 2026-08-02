export type VocabularyStatus = 'new' | 'learning' | 'mastered';

export const MAX_BOX = 5;

export function statusForBox(box: number, hasBeenReviewed: boolean): VocabularyStatus {
  if (!hasBeenReviewed) return 'new';
  if (box >= MAX_BOX) return 'mastered';
  return 'learning';
}

export const STATUS_LABELS: Record<VocabularyStatus, string> = {
  new: 'Nuevo',
  learning: 'Aprendiendo',
  mastered: 'Dominado',
};

export function statusColor(status: VocabularyStatus): string {
  if (status === 'mastered') return 'var(--color-success)';
  if (status === 'learning') return 'var(--color-warning)';
  return 'var(--color-text-muted)';
}

export function statusBackground(status: VocabularyStatus): string {
  if (status === 'mastered') return '#DCFCE7';
  if (status === 'learning') return '#FEF3C7';
  return 'var(--color-surface)';
}
