import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { LanguageCode } from '../../types/database';
import { getLinkingTokens } from '../../lib/englishLinking';
import { isContentWord } from '../../lib/englishRhythm';
import { colors } from '../../constants/theme';

interface Props {
  text: string;
  language: LanguageCode;
  style?: StyleProp<TextStyle>;
}

// Muestra la frase de referencia con marcas de ritmo del inglés cuando el
// idioma es inglés — el español no usa estas convenciones de enseñanza
// (es de ritmo silábico, no acentual), así que para 'es' se renderiza el
// texto normal:
//   - "‿" entre palabras que se conectan al hablar rápido y natural.
//   - content words (sustantivos, verbos, adjetivos...) en negrita.
//   - function words (artículos, preposiciones, pronombres...) en gris,
//     porque se pronuncian más rápido y suaves.
export function LinkedSentence({ text, language, style }: Props) {
  if (language !== 'en') {
    return <Text style={style}>{text}</Text>;
  }

  const tokens = getLinkingTokens(text);

  return (
    <Text style={style}>
      {tokens.map((token, i) => (
        <Text key={i}>
          <Text style={isContentWord(token.word) ? styles.contentWord : styles.functionWord}>{token.word}</Text>
          {i < tokens.length - 1 ? (token.linkedToNext ? <Text style={styles.tie}>‿</Text> : ' ') : null}
        </Text>
      ))}
    </Text>
  );
}

const styles = {
  tie: {
    color: colors.primary,
    fontWeight: '800' as const,
  },
  contentWord: {
    fontWeight: '800' as const,
    color: colors.text,
  },
  functionWord: {
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
};
