import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { Chip } from '../../components/common/Chip';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { supabase } from '../../config/supabase';
import { LearningObjective } from '../../types/database';
import { TranslationKey } from '../../i18n/translations';
import { colors, spacing } from '../../constants/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

const MAX_PROFILE_EDITS = 2;

// Mismas opciones que ProfessionalProfileScreen (onboarding) — misma
// codificación en español para no romper lo que ya reciben los prompts de IA.
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

function extractFunctionErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export function EditProfileScreen({ navigation }: Props) {
  const { studentProfile, refreshProfile } = useAuth();
  const { t } = useLanguage();

  const [occupation, setOccupation] = useState(studentProfile?.occupation ?? '');
  const [industry, setIndustry] = useState<string | null>(studentProfile?.industry ?? null);
  const [objectives, setObjectives] = useState<Set<string>>(
    new Set(studentProfile?.learning_objectives ?? [])
  );
  const [loading, setLoading] = useState(false);

  const editsUsed = studentProfile?.profile_edit_count ?? 0;
  const editsRemaining = Math.max(0, MAX_PROFILE_EDITS - editsUsed);
  const canEdit = editsRemaining > 0;

  const toggleObjective = (value: string) => {
    setObjectives((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const canSave = occupation.trim().length > 0 && industry !== null && objectives.size > 0;

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Faltan datos', 'Completa ocupación, industria y al menos un objetivo.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('update-professional-profile', {
      body: {
        occupation: occupation.trim(),
        industry,
        objectives: Array.from(objectives),
      },
    });
    setLoading(false);

    if (error || !data?.profile) {
      let message = extractFunctionErrorMessage(error);
      try {
        const body = await (error as { context?: Response })?.context?.json();
        if (body?.error) message = body.error;
      } catch {
        // se queda con message
      }
      Alert.alert('No se pudo guardar', message);
      return;
    }

    await refreshProfile();
    Alert.alert('Perfil actualizado', 'Puedes regenerar tu plan de curso desde la pestaña Progreso.');
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Editar perfil profesional</Text>
          <Text style={styles.quotaText}>
            {canEdit
              ? `Te queda${editsRemaining === 1 ? 'n' : ''} ${editsRemaining} edición${editsRemaining === 1 ? '' : 'es'} disponible${editsRemaining === 1 ? '' : 's'}.`
              : 'Ya usaste tus 2 ediciones. Habla con tu profesor si necesitas otro cambio.'}
          </Text>

          <Text style={styles.question}>{t('onboarding.occupationQuestion')}</Text>
          <Input
            placeholder={t('onboarding.occupationPlaceholder')}
            value={occupation}
            onChangeText={setOccupation}
            editable={canEdit}
          />

          <Text style={[styles.question, styles.spacedQuestion]}>{t('onboarding.industryQuestion')}</Text>
          <View style={styles.chipsRow}>
            {INDUSTRIES.map((option) => (
              <Chip
                key={option.value}
                label={t(option.labelKey)}
                selected={industry === option.value}
                onPress={() => canEdit && setIndustry(option.value)}
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
                onPress={() => canEdit && toggleObjective(option.value)}
              />
            ))}
          </View>

          <Button
            label="Guardar cambios"
            onPress={handleSave}
            loading={loading}
            disabled={!canSave || !canEdit}
            style={styles.saveButton}
          />
          <Button
            label="Cancelar"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quotaText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
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
  saveButton: {
    marginTop: spacing.xl,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});
