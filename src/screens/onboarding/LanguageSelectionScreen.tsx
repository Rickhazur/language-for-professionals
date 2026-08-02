import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/types';
import { LanguageCard } from '../../components/common/LanguageCard';
import { OnboardingProgress } from '../../components/common/OnboardingProgress';
import { Button } from '../../components/common/Button';
import { LanguageCode } from '../../types/database';
import { colors, spacing } from '../../constants/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'LanguageSelection'>;

const LANGUAGES: { code: LanguageCode; flag: string; label: string }[] = [
  { code: 'en', flag: '🇺🇸', label: 'Inglés' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];

const otherLanguage = (code: LanguageCode): LanguageCode => (code === 'en' ? 'es' : 'en');

export function LanguageSelectionScreen({ navigation }: Props) {
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode | null>(null);
  const [nativeLanguage, setNativeLanguage] = useState<LanguageCode | null>(null);

  const handleSelectTarget = (code: LanguageCode) => {
    setTargetLanguage(code);
    if (nativeLanguage === code) setNativeLanguage(otherLanguage(code));
  };

  const handleSelectNative = (code: LanguageCode) => {
    setNativeLanguage(code);
    if (targetLanguage === code) setTargetLanguage(otherLanguage(code));
  };

  const canContinue = targetLanguage !== null && nativeLanguage !== null;

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingProgress step={1} total={2} />

      <Text style={styles.question}>¿Qué idioma quieres aprender?</Text>
      <View style={styles.row}>
        {LANGUAGES.map((lang) => (
          <LanguageCard
            key={lang.code}
            flag={lang.flag}
            label={lang.label}
            selected={targetLanguage === lang.code}
            onPress={() => handleSelectTarget(lang.code)}
          />
        ))}
      </View>

      <Text style={[styles.question, styles.secondQuestion]}>¿Cuál es tu idioma nativo?</Text>
      <View style={styles.row}>
        {LANGUAGES.map((lang) => (
          <LanguageCard
            key={lang.code}
            flag={lang.flag}
            label={lang.label}
            selected={nativeLanguage === lang.code}
            onPress={() => handleSelectNative(lang.code)}
          />
        ))}
      </View>

      <Button
        label="Continuar"
        disabled={!canContinue}
        style={styles.continueButton}
        onPress={() =>
          navigation.navigate('ProfessionalProfile', {
            targetLanguage: targetLanguage as LanguageCode,
            nativeLanguage: nativeLanguage as LanguageCode,
          })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  secondQuestion: {
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  continueButton: {
    marginTop: 'auto',
  },
});
