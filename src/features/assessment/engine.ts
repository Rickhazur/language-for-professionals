import { CefrLevel } from '../../types/database';
import { AssessmentQuestion, AssessmentSkill } from '../../data/levelAssessmentQuestions';

export const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const TOTAL_WRITTEN_QUESTIONS = 12;
export const START_LEVEL_INDEX = 2; // arranca en B1

export interface AnsweredQuestion {
  question: AssessmentQuestion;
  selectedIndex: number;
  correct: boolean;
}

// Escalera adaptativa: acierto sube un nivel CEFR, error baja uno.
export function nextLevelIndex(current: number, correct: boolean): number {
  const next = current + (correct ? 1 : -1);
  return Math.min(LEVELS.length - 1, Math.max(0, next));
}

export function pickQuestion(
  bank: AssessmentQuestion[],
  levelIndex: number,
  skill: AssessmentSkill,
  usedIds: Set<string>
): AssessmentQuestion {
  const targetLevel = LEVELS[levelIndex];
  const exact = bank.filter((q) => q.skill === skill && q.level === targetLevel && !usedIds.has(q.id));
  if (exact.length > 0) return exact[Math.floor(Math.random() * exact.length)];

  // Sin preguntas sin usar en ese nivel: busca en niveles cercanos, expandiendo el radio.
  for (let radius = 1; radius < LEVELS.length; radius++) {
    const candidates = bank.filter(
      (q) => q.skill === skill && !usedIds.has(q.id) && Math.abs(LEVELS.indexOf(q.level) - levelIndex) === radius
    );
    if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Banco agotado: último recurso, permite repetir una pregunta de la misma skill.
  const sameSkill = bank.filter((q) => q.skill === skill);
  return sameSkill[Math.floor(Math.random() * sameSkill.length)];
}

export function summarizeWritten(history: AnsweredQuestion[], finalLevelIndex: number) {
  const scoreFor = (skill: AssessmentSkill) => {
    const items = history.filter((h) => h.question.skill === skill);
    if (items.length === 0) return 0;
    const correctCount = items.filter((h) => h.correct).length;
    return Math.round((correctCount / items.length) * 100);
  };

  return {
    grammarScore: scoreFor('grammar'),
    vocabularyScore: scoreFor('vocabulary'),
    writtenLevelIndex: finalLevelIndex,
  };
}

// ── Resultado oral simulado ──────────────────────────────────────────────
// El análisis real de pronunciación (fonema por fonema) todavía no está
// conectado. Por ahora generamos un puntaje plausible para poder completar
// el flujo de principio a fin y guardar un resultado en level_assessments.
export function simulateSpeakingScore(): number {
  return Math.round(55 + Math.random() * 40); // 55-95
}

export function computeOverallLevel(writtenLevelIndex: number, speakingScoreAvg: number): CefrLevel {
  let adjustment = 0;
  if (speakingScoreAvg >= 85) adjustment = 1;
  else if (speakingScoreAvg < 70) adjustment = -1;

  const finalIndex = Math.min(LEVELS.length - 1, Math.max(0, writtenLevelIndex + adjustment));
  return LEVELS[finalIndex];
}
