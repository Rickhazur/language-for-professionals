import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { LanguageCode } from '../../types/database';
import { getLinkingTokens } from '../../lib/englishLinking';
import { colors } from '../../constants/theme';

interface Props {
  text: string;
  language: LanguageCode;
  style?: StyleProp<TextStyle>;
}

// Muestra la frase de referencia con marcas de "linking" (‿) cuando el
// idioma es inglés — el español no usa esta convención de enseñanza, así
// que para 'es' simplemente se renderiza el texto normal.
export function LinkedSentence({ text, language, style }: Props) {
  if (language !== 'en') {
    return <Text style={style}>{text}</Text>;
  }

  const tokens = getLinkingTokens(text);

  return (
    <Text style={style}>
      {tokens.map((token, i) => (
        <Text key={i}>
          {token.word}
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
};
