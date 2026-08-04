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
//   - "‿" azul entre palabras que se conectan al hablar (consonante->vocal).
//   - "‿" ámbar + última letra tachada/atenuada cuando esa consonante final
//     (t/d) se reduce casi hasta desaparecer ante la consonante siguiente.
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
      {tokens.map((token, i) => {
        const isLast = i === tokens.length - 1;
        const wordStyle = isContentWord(token.word) ? styles.contentWord : styles.functionWord;

        if (token.reducedEnding && token.word.length > 1) {
          const head = token.word.slice(0, -1);
          const tail = token.word.slice(-1);
          return (
            <Text key={i}>
              <Text style={wordStyle}>{head}</Text>
              <Text style={[wordStyle, styles.reducedLetter]}>{tail}</Text>
              {!isLast ? <Text style={styles.reduceTie}>‿</Text> : null}
            </Text>
          );
        }

        return (
          <Text key={i}>
            <Text style={wordStyle}>{token.word}</Text>
            {!isLast ? (token.linkedToNext ? <Text style={styles.tie}>‿</Text> : ' ') : null}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = {
  tie: {
    color: colors.primary,
    fontWeight: '800' as const,
  },
  reduceTie: {
    color: '#D97706',
    fontWeight: '800' as const,
  },
  reducedLetter: {
    opacity: 0.4,
    textDecorationLine: 'line-through' as const,
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
