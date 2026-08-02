// Sistema Leitner simple para repaso de vocabulario: 5 cajas, un acierto
// sube de caja (repaso más espaciado), un error resetea a la caja 1. La
// caja 5 es "dominado" pero sigue reapareciendo cada tanto (igual que un
// Leitner real), no desaparece para siempre.
export const MAX_BOX = 5;
export const BOX_INTERVALS_DAYS = [1, 2, 4, 9, 20]; // índice 0 = caja 1

export type VocabularyStatus = 'new' | 'learning' | 'mastered';

export interface BoxState {
  box: number;
  nextReviewAt: Date;
}

export function nextBoxState(currentBox: number, correct: boolean, now: Date = new Date()): BoxState {
  const box = correct ? Math.min(MAX_BOX, currentBox + 1) : 1;
  const intervalDays = BOX_INTERVALS_DAYS[box - 1];
  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return { box, nextReviewAt };
}

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
