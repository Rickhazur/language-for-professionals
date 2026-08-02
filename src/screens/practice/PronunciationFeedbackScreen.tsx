import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { scoreColor, scoreBackground } from '../../lib/scoreColor';
import { WordErrorType } from '../../types/database';
import { colors, spacing } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'PronunciationFeedback'>;

const ERROR_LABELS: Record<string, string> = {
  Omission: 'no dicha',
  Insertion: 'palabra extra',
  Mispronunciation: 'mal pronunciada',
  UnexpectedBreak: 'pausa inesperada',
  MissingBreak: 'faltó pausa',
  Monotone: 'monótono',
};

function ScoreBadge({ label, score }: { label: string; score: number | null }) {
  return (
    <View style={[styles.scoreBadge, { backgroundColor: scoreBackground(score) }]}>
      <Text style={[styles.scoreValue, { color: scoreColor(score) }]}>
        {score !== null ? Math.round(score) : '—'}
      </Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

export function PronunciationFeedbackScreen({ route, navigation }: Props) {
  const { attempt, words, newBadges } = route.params;
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

  const expandedWord = words.find((w) => w.id === expandedWordId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Resultado de pronunciación</Text>

        {newBadges && newBadges.length > 0 && (
          <View style={styles.badgeBanner}>
            {newBadges.map((badge) => (
              <Text key={badge.id} style={styles.badgeBannerText}>
                {badge.icon} ¡Nueva insignia! {badge.title}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.scoreRow}>
          <ScoreBadge label="Precisión" score={attempt.accuracy_score} />
          <ScoreBadge label="Fluidez" score={attempt.fluency_score} />
          <ScoreBadge label="Entonación" score={attempt.prosody_score} />
        </View>
        <View style={styles.scoreRowSecondary}>
          <ScoreBadge label="Completitud" score={attempt.completeness_score} />
          <ScoreBadge label="General" score={attempt.pron_score} />
        </View>

        <Text style={styles.sectionTitle}>Frase</Text>
        <Text style={styles.referenceText}>{attempt.reference_text}</Text>
        {attempt.recognized_text && (
          <Text style={styles.recognizedText}>Se detectó: "{attempt.recognized_text}"</Text>
        )}

        <Text style={styles.sectionTitle}>Toca una palabra para ver el detalle por sonido</Text>
        <View style={styles.wordsWrap}>
          {words.map((w) => {
            const isOmission = w.error_type === 'Omission';
            return (
              <Pressable
                key={w.id}
                onPress={() => setExpandedWordId(expandedWordId === w.id ? null : w.id)}
                style={[
                  styles.wordChip,
                  { backgroundColor: isOmission ? colors.surface : scoreBackground(w.accuracy_score) },
                  isOmission && styles.wordChipOmission,
                  expandedWordId === w.id && styles.wordChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.wordChipText,
                    { color: isOmission ? colors.textMuted : scoreColor(w.accuracy_score) },
                    isOmission && styles.wordChipTextOmission,
                  ]}
                >
                  {w.word}
                </Text>
                {w.error_type && w.error_type !== 'None' && (
                  <Text style={styles.wordChipError}>{ERROR_LABELS[w.error_type] ?? w.error_type}</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Bien (80-100)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
            <Text style={styles.legendText}>Regular (60-79)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>Revisar (&lt;60)</Text>
          </View>
        </View>

        {expandedWord && (
          <View style={styles.phonemeCard}>
            <Text style={styles.phonemeCardTitle}>Sonidos de "{expandedWord.word}"</Text>
            {expandedWord.phonemes.length === 0 ? (
              <Text style={styles.phonemeEmpty}>Sin desglose por sonido para esta palabra.</Text>
            ) : (
              <View style={styles.phonemesRow}>
                {expandedWord.phonemes.map((p) => (
                  <View key={p.id} style={[styles.phonemeChip, { backgroundColor: scoreBackground(p.accuracy_score) }]}>
                    <Text style={[styles.phonemeSymbol, { color: scoreColor(p.accuracy_score) }]}>/{p.phoneme}/</Text>
                    <Text style={styles.phonemeScore}>
                      {p.accuracy_score !== null ? Math.round(p.accuracy_score) : '—'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Button label="Volver a practicar" onPress={() => navigation.goBack()} style={styles.backButton} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  badgeBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  badgeBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  scoreRowSecondary: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  scoreBadge: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  referenceText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  recognizedText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  wordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  wordChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  wordChipOmission: {
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  wordChipSelected: {
    borderColor: colors.primary,
  },
  wordChipText: {
    fontSize: 16,
    fontWeight: '700',
  },
  wordChipTextOmission: {
    textDecorationLine: 'line-through',
  },
  wordChipError: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  phonemeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  phonemeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  phonemeEmpty: {
    fontSize: 13,
    color: colors.textMuted,
  },
  phonemesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  phonemeChip: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    minWidth: 48,
  },
  phonemeSymbol: {
    fontSize: 15,
    fontWeight: '700',
  },
  phonemeScore: {
    fontSize: 11,
    color: colors.textMuted,
  },
  backButton: {
    margin: spacing.lg,
  },
});
