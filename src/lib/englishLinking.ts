// Detecta "linking" en inglés (cómo las palabras se conectan al hablar
// rápido y natural, ej. "turn it off" suena "tur-ni-toff") — puramente por
// heurística de ortografía, sin diccionario fonético ni llamada a IA: la
// regla que cubre casi todos los casos enseñados en materiales de inglés es
// "si la siguiente palabra empieza con sonido vocálico, se conecta con la
// anterior". No pretende ser 100% preciso fonéticamente — es una ayuda
// visual para que el estudiante note el patrón, no una transcripción IPA.

const VOWEL_LETTERS = new Set(['a', 'e', 'i', 'o', 'u']);

// Palabras comunes donde la ortografía no coincide con el sonido inicial —
// lista corta a propósito, cubre los casos más frecuentes en vocabulario
// profesional en vez de intentar ser exhaustiva.
const STARTS_WITH_CONSONANT_SOUND = new Set([
  'university', 'universal', 'unique', 'unit', 'united', 'union', 'usual', 'unusual',
  'user', 'use', 'used', 'useful', 'uniform', 'one', 'once', 'european', 'europe',
]);
const STARTS_WITH_VOWEL_SOUND = new Set(['hour', 'hours', 'hourly', 'honest', 'honesty', 'honor', 'honors', 'heir']);

const BOUNDARY_PUNCTUATION = /[.!?,;:]$/;

function stripPunctuation(word: string): string {
  return word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
}

function startsInVowelSound(word: string): boolean {
  const w = stripPunctuation(word).toLowerCase();
  if (!w) return false;
  if (STARTS_WITH_CONSONANT_SOUND.has(w)) return false;
  if (STARTS_WITH_VOWEL_SOUND.has(w)) return true;
  return VOWEL_LETTERS.has(w[0]);
}

export interface LinkingToken {
  word: string;
  linkedToNext: boolean;
}

// Regla única: una palabra se conecta con la siguiente si esa siguiente
// palabra empieza con sonido vocálico (cubre tanto consonante->vocal, el
// caso más común y enseñado, como vocal->vocal) — y nunca si la palabra
// actual termina en puntuación de pausa (. , ; : ! ?).
export function getLinkingTokens(sentence: string): LinkingToken[] {
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  return words.map((word, i) => {
    if (i === words.length - 1) return { word, linkedToNext: false };
    if (BOUNDARY_PUNCTUATION.test(word)) return { word, linkedToNext: false };
    return { word, linkedToNext: startsInVowelSound(words[i + 1]) };
  });
}
