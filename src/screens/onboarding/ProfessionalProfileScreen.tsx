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
import { supabase } from '../../config/supabase';
import { LearningObjective } from '../../types/database';
import { colors, spacing } from '../../constants/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfessionalProfile'>;

const INDUSTRIES = [
  'Tecnología',
  'Finanzas',
  'Salud',
  'Educación',
  'Manufactura',
  'Ventas y comercio',
  'Turismo y hospitalidad',
  'Legal',
  'Otra',
];

const OBJECTIVES: { value: LearningObjective; label: string }[] = [
  { value: 'meetings', label: 'Reuniones' },
  { value: 'emails', label: 'Correos' },
  { value: 'negotiation', label: 'Negociación' },
  { value: 'presentations', label: 'Presentaciones' },
  { value: 'customer_service', label: 'Atención a clientes' },
  { value: 'travel', label: 'Viajes' },
];

export function ProfessionalProfileScreen({ route }: Props) {
  const { targetLanguage, nativeLanguage } = route.params;
  const { session, refreshProfile } = useAuth();
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
      Alert.alert('Faltan datos', 'Completa tu ocupación, industria y al menos un objetivo.');
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

          <Text style={styles.question}>¿A qué te dedicas?</Text>
          <Input placeholder="Ej. Gerente de ventas" value={occupation} onChangeText={setOccupation} />

          <Text style={[styles.question, styles.spacedQuestion]}>¿En qué industria trabajas?</Text>
          <View style={styles.chipsRow}>
            {INDUSTRIES.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={industry === option}
                onPress={() => setIndustry(option)}
              />
            ))}
          </View>

          <Text style={[styles.question, styles.spacedQuestion]}>
            ¿Para qué quieres usar el idioma? (elige una o más)
          </Text>
          <View style={styles.chipsRow}>
            {OBJECTIVES.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={objectives.has(option.value)}
                onPress={() => toggleObjective(option.value)}
              />
            ))}
          </View>

          <Button
            label="Terminar"
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
