import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { Chip } from '../../components/common/Chip';
import { Button } from '../../components/common/Button';
import { OnboardingProgress } from '../../components/common/OnboardingProgress';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { supabase } from '../../config/supabase';
import { LearningObjective } from '../../types/database';
import { TranslationKey } from '../../i18n/translations';
import { colors, spacing } from '../../constants/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfessionalProfile'>;

// "value" es lo que se guarda en student_profiles.industry (texto libre) —
// se mantiene en español sin importar el idioma de la interfaz, para no
// cambiar lo que ya reciben los prompts de IA. "labelKey" es solo lo que se
// muestra en pantalla.
const INDUSTRIES: { value: string; labelKey: TranslationKey }[] = [
  { value: 'Tecnología', labelKey: 'onboarding.industry.tech' },
  { value: 'Finanzas', labelKey: 'onboarding.industry.finance' },
  { value: 'Salud', labelKey: 'onboarding.industry.health' },
  { value: 'Educación', labelKey: 'onboarding.industry.education' },
  { value: 'Manufactura', labelKey: 'onboarding.industry.manufacturing' },
  { value: 'Ventas y comercio', labelKey: 'onboarding.industry.sales' },
  { value: 'Turismo y hospitalidad', labelKey: 'onboarding.industry.tourism' },
  { value: 'Legal', labelKey: 'onboarding.industry.legal' },
  { value: 'Otra', labelKey: 'onboarding.industry.other' },
];

const OBJECTIVES: { value: LearningObjective; labelKey: TranslationKey }[] = [
  { value: 'meetings', labelKey: 'onboarding.objective.meetings' },
  { value: 'emails', labelKey: 'onboarding.objective.emails' },
  { value: 'negotiation', labelKey: 'onboarding.objective.negotiation' },
  { value: 'presentations', labelKey: 'onboarding.objective.presentations' },
  { value: 'customer_service', labelKey: 'onboarding.objective.customerService' },
  { value: 'travel', labelKey: 'onboarding.objective.travel' },
];

export function ProfessionalProfileScreen({ route }: Props) {
  const { targetLanguage, nativeLanguage } = route.params;
  const { session, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [occupation, setOccupation] = useState('');
  const [industry, setIndustry] = useState<string | null>(null);
  const [objectives, setObjectives] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleObjective = (value: string) => {
    setObjectives((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const canFinish = occupation.trim().length > 0 && industry !== null && objectives.size > 0;

  const handleFinish = async () => {
    if (!session) return;
    if (!canFinish) {
      Alert.alert(t('common.missingDataTitle'), t('onboarding.alertMissingMessage'));
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('student_profiles')
      .update({
        target_language: targetLanguage,
        native_language: nativeLanguage,
        occupation: occupation.trim(),
        industry,
        learning_objectives: Array.from(objectives),
        onboarding_completed: true,
      })
      .eq('id', session.user.id);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    // Refresca el contexto: al ver onboarding_completed = true, RootNavigator
    // cambia automáticamente de OnboardingStack a MainTabs.
    await refreshProfile();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <OnboardingProgress step={2} total={2} />

          <Text style={styles.question}>{t('onboarding.occupationQuestion')}</Text>
          <Input placeholder={t('onboarding.occupationPlaceholder')} value={occupation} onChangeText={setOccupation} />

          <Text style={[styles.question, styles.spacedQuestion]}>{t('onboarding.industryQuestion')}</Text>
          <View style={styles.chipsRow}>
            {INDUSTRIES.map((option) => (
              <Chip
                key={option.value}
                label={t(option.labelKey)}
                selected={industry === option.value}
                onPress={() => setIndustry(option.value)}
              />
            ))}
          </View>

          <Text style={[styles.question, styles.spacedQuestion]}>{t('onboarding.objectivesQuestion')}</Text>
          <View style={styles.chipsRow}>
            {OBJECTIVES.map((option) => (
              <Chip
                key={option.value}
                label={t(option.labelKey)}
                selected={objectives.has(option.value)}
                onPress={() => toggleObjective(option.value)}
              />
            ))}
          </View>

          <Button
            label={t('onboarding.finishButton')}
            onPress={handleFinish}
            loading={loading}
            disabled={!canFinish}
            style={styles.finishButton}
          />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  spacedQuestion: {
    marginTop: spacing.xl,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  finishButton: {
    marginTop: spacing.xl,
  },
});
