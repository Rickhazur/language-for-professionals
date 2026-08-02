import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { PillButton } from '../../components/common/PillButton';
import { spacing, colors, vibrant } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

// Los 4 iconos se ubican sobre el anillo exterior (radio 120 desde el centro
// de un contenedor de 300x300), a 90° uno del otro, para quedar todos a la
// misma distancia del centro — igual que en la referencia.
const ORBIT_ICONS: { icon: keyof typeof Ionicons.glyphMap; color: string; top: number; left: number }[] = [
  { icon: 'mic-outline', color: '#2563EB', top: 43, left: 43 },
  { icon: 'chatbubble-ellipses-outline', color: '#7C3AED', top: 43, left: 213 },
  { icon: 'locate-outline', color: '#E11D48', top: 213, left: 43 },
  { icon: 'trophy-outline', color: '#D97706', top: 213, left: 213 },
];

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string; bg: string; iconColor: string }[] = [
  { icon: 'mic-outline', label: 'Shadowing con IA', bg: '#DBEAFE', iconColor: '#2563EB' },
  { icon: 'chatbubble-ellipses-outline', label: 'Roleplay profesional', bg: '#EDE9FE', iconColor: '#7C3AED' },
  { icon: 'locate-outline', label: 'Sonidos precisos', bg: '#FFE4E6', iconColor: '#E11D48' },
  { icon: 'trophy-outline', label: 'Rachas e insignias', bg: '#FEF3C7', iconColor: '#D97706' },
];

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobBottomLeft]} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>🎓 LinguaPro</Text>
        <Text style={styles.headline}>¡Hola! 👋</Text>
        <Text style={styles.tagline}>
          Tu compañero de inglés y español con IA — practica para tu profesión, no para un examen.
        </Text>

        <View style={styles.orbitWrap}>
          <View style={styles.orbitRing} />
          <View style={styles.orbitRingInner} />
          <View style={styles.centerCircle}>
            <Text style={styles.centerFlags}>🇺🇸 ⇄ 🇪🇸</Text>
            <Text style={styles.centerLabel}>Inglés ⇄ Español</Text>
            <Text style={styles.centerSub}>con IA</Text>
          </View>
          {ORBIT_ICONS.map((o, i) => (
            <View key={i} style={[styles.orbitIcon, { top: o.top, left: o.left }]}>
              <Ionicons name={o.icon} size={20} color={o.color} />
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresRow}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureCard}>
              <View style={[styles.featureIconWrap, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon} size={20} color={f.iconColor} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <PillButton label="Comenzar  →" onPress={() => navigation.navigate('Register')} style={styles.cta} />
          <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            ¿Ya tienes cuenta? <Text style={styles.loginLinkBold}>Inicia sesión</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F7FD',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTopRight: {
    width: 320,
    height: 320,
    top: -120,
    right: -100,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  blobBottomLeft: {
    width: 260,
    height: 260,
    bottom: -80,
    left: -110,
    backgroundColor: 'rgba(236, 72, 153, 0.10)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  brand: {
    fontSize: 15,
    fontWeight: '800',
    color: vibrant.purple,
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
    maxWidth: 340,
  },
  orbitWrap: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  orbitRing: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(124, 58, 237, 0.28)',
  },
  orbitRingInner: {
    position: 'absolute',
    top: 50,
    left: 50,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(124, 58, 237, 0.15)',
  },
  centerCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#3B0764',
        shadowOpacity: 0.18,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
      default: { boxShadow: '0 8px 24px rgba(59, 7, 100, 0.16)' },
    }),
  },
  centerFlags: {
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  centerLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  centerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  orbitIcon: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#3B0764',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
      default: { boxShadow: '0 4px 12px rgba(59, 7, 100, 0.14)' },
    }),
  },
  featuresRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.lg,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    width: 108,
    ...Platform.select({
      ios: {
        shadowColor: '#3B0764',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
      default: { boxShadow: '0 4px 12px rgba(59, 7, 100, 0.08)' },
    }),
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cta: {
    width: '100%',
    maxWidth: 320,
  },
  loginLink: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
  },
  loginLinkBold: {
    color: vibrant.purple,
    fontWeight: '700',
  },
});
