// Distingue "content words" (sustantivos, verbos principales, adjetivos,
// adverbios, negativos) de "function words" (artículos, preposiciones,
// pronombres, verbos auxiliares, conjunciones) — el inglés es un idioma de
// ritmo acentual: las content words se pronuncian más fuertes y más largas,
// las function words se "comen"/reducen. El español es de ritmo silábico
// (cada sílaba pesa casi igual), por eso este patrón no existe ahí y esto
// solo aplica a inglés.
//
// Clasificación por lista cerrada, sin IA: las function words en inglés son
// una clase cerrada y bien conocida (no se inventan nuevas preposiciones o
// pronombres) — cualquier palabra que NO esté en esta lista se trata como
// content word. Los negativos ("not", "never", "no") se excluyen a propósito
// de la lista: aunque son gramaticales, sí llevan acento en el habla real.

const FUNCTION_WORDS = new Set([
  // artículos
  'a', 'an', 'the',
  // pronombres personales, posesivos, reflexivos y relativos
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',
  'who', 'whom', 'whose', 'which', 'that', 'this', 'these', 'those',
  // preposiciones
  'in', 'on', 'at', 'of', 'to', 'for', 'with', 'by', 'from', 'about',
  'into', 'onto', 'over', 'under', 'above', 'below', 'between', 'among',
  'through', 'during', 'before', 'after', 'since', 'until', 'against',
  'without', 'within', 'along', 'across', 'behind', 'beyond', 'near',
  'off', 'up', 'down', 'out',
  // verbos auxiliares y modales
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  // conjunciones
  'and', 'but', 'or', 'nor', 'so', 'yet', 'because', 'although', 'though',
  'while', 'if', 'unless', 'whether', 'as',
  // otros
  'there', 'than', 'then',
]);

function stripPunctuation(word: string): string {
  return word.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');
}

export function isContentWord(word: string): boolean {
  const w = stripPunctuation(word).toLowerCase();
  if (!w) return false;
  return !FUNCTION_WORDS.has(w);
}
