// Detecta "linking" en inglés (cómo las palabras se conectan al hablar
// rápido y natural) — puramente por heurística de ortografía, sin
// diccionario fonético ni llamada a IA. Dos fenómenos, enseñados juntos en
// materiales de pronunciación pero con reglas distintas:
//   1. Ligazón consonante->vocal: "turn it off" suena "tur-ni-toff" — si la
//      siguiente palabra empieza con sonido vocálico, se conecta con la
//      anterior.
//   2. Reducción de consonante final ante otra consonante: cuando una
//      palabra termina en /t/ o /d/ y la siguiente empieza en consonante,
//      esa consonante final casi desaparece al hablar rápido/natural
//      ("want to" -> "wanna", "next Monday" -> "nex' Monday", "good night"
//      -> "goo' night"). Es la regla más enseñada de este tipo — no cubre
//      cada caso de asimilación posible, pero sí el patrón más frecuente en
//      inglés conversacional.
// No pretende ser 100% preciso fonéticamente — es una ayuda visual para que
// el estudiante note el patrón, no una transcripción IPA.

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
  // La última letra de "word" (normalmente t/d) se pronuncia muy reducida
  // o desaparece porque la palabra siguiente empieza en consonante.
  reducedEnding: boolean;
}

const REDUCIBLE_ENDING_LETTERS = new Set(['t', 'd']);

function endsInReducibleConsonant(word: string): boolean {
  const w = stripPunctuation(word).toLowerCase();
  if (w.length < 2) return false;
  return REDUCIBLE_ENDING_LETTERS.has(w[w.length - 1]);
}

// Regla de ligazón: una palabra se conecta con la siguiente si esa
// siguiente palabra empieza con sonido vocálico (cubre tanto
// consonante->vocal, el caso más común y enseñado, como vocal->vocal) — y
// nunca si la palabra actual termina en puntuación de pausa (. , ; : ! ?).
// Regla de reducción: si NO hay ligazón (la siguiente palabra empieza en
// consonante) y la palabra actual termina en /t/ o /d/, esa consonante
// final se marca como reducida.
export function getLinkingTokens(sentence: string): LinkingToken[] {
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  return words.map((word, i) => {
    if (i === words.length - 1) return { word, linkedToNext: false, reducedEnding: false };
    if (BOUNDARY_PUNCTUATION.test(word)) return { word, linkedToNext: false, reducedEnding: false };

    const nextWord = words[i + 1];
    const linkedToNext = startsInVowelSound(nextWord);
    const reducedEnding = !linkedToNext && endsInReducibleConsonant(word);
    return { word, linkedToNext, reducedEnding };
  });
}
