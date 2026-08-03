import React, { useState } from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AssessmentStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { colors, spacing, gradients, cardShadow } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<AssessmentStackParamList, 'Result'>;

const SKILL_ROWS: {
  key: 'grammar_score' | 'vocabulary_score' | 'listening_score' | 'speaking_score';
  label: string;
}[] = [
  { key: 'grammar_score', label: 'Gramática' },
  { key: 'vocabulary_score', label: 'Vocabulario' },
  { key: 'listening_score', label: 'Escucha' },
  { key: 'speaking_score', label: 'Pronunciación (simulado)' },
];

// Número del profesor para el botón de contacto de la oferta post-examen —
// mientras no exista pago dentro de la app, el cierre de venta es manual.
const TEACHER_WHATSAPP_NUMBER = '573166267846';

export function AssessmentResultScreen({ route, navigation }: Props) {
  const { assessment } = route.params;
  const { t } = useLanguage();
  const { refreshProfile } = useAuth();
  const [continuing, setContinuing] = useState(false);

  const handleContinue = async () => {
    // Este resultado se ve en dos contextos: (1) examen obligatorio recién
    // registrado — AssessmentStack se monta directo desde RootNavigator, sin
    // navegador padre; al refrescar el perfil, RootNavigator ve el
    // level_assessments/course_plan recién creado y cambia de pantalla solo
    // (mismo patrón que ProfessionalProfileScreen para salir de onboarding).
    // (2) reintento opcional desde Inicio — ahí Assessment sí es un modal
    // anidado dentro de AppStack, así que además hay que cerrarlo a mano.
    setContinuing(true);
    await refreshProfile();
    navigation.getParent()?.goBack();
    setContinuing(false);
  };

  const handleClaimOffer = async () => {
    const languageLabel = assessment.language === 'en' ? t('common.langEnglish') : t('common.langSpanish');
    const message = t('assessmentOffer.whatsappMessage', {
      level: assessment.overall_level,
      language: languageLabel,
    });
    const url = `https://wa.me/${TEACHER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
      return;
    }
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Tu nivel estimado es</Text>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.levelCircle}>
          <Text style={styles.level}>{assessment.overall_level}</Text>
        </LinearGradient>

        <View style={styles.breakdown}>
          {SKILL_ROWS.map(({ key, label }) => {
            const value = assessment[key];
            return (
              <View key={key} style={styles.row}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowValue}>{value !== null ? `${value}%` : '—'}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.disclaimer}>
          El puntaje de pronunciación es simulado por ahora. Pronto lo calcularemos a partir del
          análisis real de tu grabación.
        </Text>

        <View style={styles.offerCard}>
          <Text style={styles.offerSectionTitle}>{t('assessmentOffer.title')}</Text>
          <Text style={styles.offerBody}>{t('assessmentOffer.body')}</Text>

          <View style={styles.offerHighlight}>
            <Text style={styles.offerHighlightTitle}>{t('assessmentOffer.offerTitle')}</Text>
            <Text style={styles.offerHighlightBody}>{t('assessmentOffer.offerBody')}</Text>
          </View>

          <Button label={t('assessmentOffer.ctaButton')} onPress={handleClaimOffer} style={styles.offerButton} />
        </View>
      </View>

      <Button label="Continuar" variant="secondary" onPress={handleContinue} loading={continuing} style={styles.button} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  label: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  levelCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  level: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
  },
  breakdown: {
    width: '100%',
    gap: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.md,
    ...cardShadow,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  rowLabel: {
    fontSize: 16,
    color: colors.text,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  disclaimer: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  offerCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    marginTop: spacing.xl,
    ...cardShadow,
  },
  offerSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  offerBody: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  offerHighlight: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  offerHighlightTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  offerHighlightBody: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    textAlign: 'center',
  },
  offerButton: {
    marginTop: spacing.lg,
    marginBottom: 0,
  },
  button: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
});
