import { CefrLevel } from '../../types/database';
import { AssessmentQuestion, AssessmentSkill } from '../../data/levelAssessmentQuestions';

export const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const TOTAL_WRITTEN_QUESTIONS = 18;
export const START_LEVEL_INDEX = 2; // arranca en B1

const INITIAL_STEP = 2;
const MIN_STEP = 1;

export interface AnsweredQuestion {
  question: AssessmentQuestion;
  selectedIndex: number;
  correct: boolean;
}

// ── Escalera adaptativa (modelo tipo British Council / Cambridge) ───────
// En vez de subir/bajar siempre un nivel fijo, el "paso" empieza grande
// (para ubicar rápido la región correcta) y se reduce a la mitad cada vez
// que el estudiante cambia de dirección (pasa de acertar a fallar o
// viceversa) — eso es un "reversal". El nivel final se calcula como el
// promedio de los reversals, no solo la última respuesta, para que una
// pregunta suerte/mala racha aislada no decida todo el resultado.
export interface StaircaseState {
  levelIndex: number;
  step: number;
  lastDirection: 'up' | 'down' | null;
}

export function initialStaircaseState(): StaircaseState {
  return { levelIndex: START_LEVEL_INDEX, step: INITIAL_STEP, lastDirection: null };
}

export function advanceStaircase(
  state: StaircaseState,
  correct: boolean
): { next: StaircaseState; reversalLevelIndex: number | null } {
  const direction: 'up' | 'down' = correct ? 'up' : 'down';
  const isReversal = state.lastDirection !== null && state.lastDirection !== direction;
  const nextStep = isReversal ? Math.max(MIN_STEP, Math.floor(state.step / 2)) : state.step;
  const delta = direction === 'up' ? nextStep : -nextStep;
  const nextLevelIndex = Math.min(LEVELS.length - 1, Math.max(0, state.levelIndex + delta));

  return {
    next: { levelIndex: nextLevelIndex, step: nextStep, lastDirection: direction },
    reversalLevelIndex: isReversal ? state.levelIndex : null,
  };
}

// Nivel final a partir de los puntos de "reversal" registrados durante la
// prueba. Solo se promedian los últimos reversals (se descartan los
// primeros, que son parte de la búsqueda gruesa inicial y todavía no
// reflejan el nivel real) — la misma práctica estándar de los métodos de
// escalera adaptativa. Sin reversals (el estudiante acertó o falló todo,
// típico de niveles muy bajos o muy altos) se usa el último índice alcanzado.
const REVERSALS_TO_AVERAGE = 6;

export function finalLevelFromReversals(reversalLevels: number[], fallbackLevelIndex: number): number {
  if (reversalLevels.length === 0) return fallbackLevelIndex;
  const tail = reversalLevels.slice(-REVERSALS_TO_AVERAGE);
  const avg = tail.reduce((sum, v) => sum + v, 0) / tail.length;
  return Math.min(LEVELS.length - 1, Math.max(0, Math.round(avg)));
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

export function computeOverallLevel(
  writtenLevelIndex: number,
  speakingScoreAvg: number,
  listeningScoreAvg: number
): CefrLevel {
  const oralAvg = (speakingScoreAvg + listeningScoreAvg) / 2;
  let adjustment = 0;
  if (oralAvg >= 85) adjustment = 1;
  else if (oralAvg < 70) adjustment = -1;

  const finalIndex = Math.min(LEVELS.length - 1, Math.max(0, writtenLevelIndex + adjustment));
  return LEVELS[finalIndex];
}
