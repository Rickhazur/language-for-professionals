import React from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { useLanguage } from '../../hooks/useLanguage';
import { colors, spacing, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'PracticeMenu'>;

export function PracticeScreen({ navigation }: Props) {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('practice.title')}</Text>
        <Text style={styles.subtitle}>{t('practice.subtitle')}</Text>

        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="mic-outline" size={22} color="#2563EB" />
          </View>
          <Text style={styles.cardTitle}>{t('practice.shadowingTitle')}</Text>
          <Text style={styles.cardText}>{t('practice.shadowingText')}</Text>
          <Button label={t('practice.shadowingButton')} onPress={() => navigation.navigate('Shadowing')} />
        </View>

        <View style={[styles.card, styles.secondCard]}>
          <View style={[styles.iconWrap, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#7C3AED" />
          </View>
          <Text style={styles.cardTitle}>{t('practice.roleplayTitle')}</Text>
          <Text style={styles.cardText}>{t('practice.roleplayText')}</Text>
          <Button label={t('practice.roleplayButton')} onPress={() => navigation.navigate('RoleplaySelect')} />
        </View>

        <View style={[styles.card, styles.secondCard]}>
          <View style={[styles.iconWrap, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="book-outline" size={22} color="#16A34A" />
          </View>
          <Text style={styles.cardTitle}>Vocabulario</Text>
          <Text style={styles.cardText}>Repasa tus términos profesionales con repetición espaciada.</Text>
          <Button
            label="Practicar vocabulario"
            onPress={() => {
              const parentNavigate = navigation.getParent()?.navigate as unknown as
                | ((name: string, params?: object) => void)
                | undefined;
              parentNavigate?.('Progress', { screen: 'VocabularyBank' });
            }}
          />
        </View>

        <View style={[styles.card, styles.secondCard]}>
          <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="construct-outline" size={22} color="#D97706" />
          </View>
          <Text style={styles.cardTitle}>Gramática</Text>
          <Text style={styles.cardText}>Preguntas de opción múltiple calibradas a tu nivel.</Text>
          <Button label="Practicar gramática" onPress={() => navigation.navigate('GrammarPractice')} />
        </View>

        <View style={[styles.card, styles.secondCard]}>
          <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="headset-outline" size={22} color="#2563EB" />
          </View>
          <Text style={styles.cardTitle}>Listening</Text>
          <Text style={styles.cardText}>Escucha y responde sin traducir, para entender de verdad.</Text>
          <Button label="Practicar listening" onPress={() => navigation.navigate('ListeningPractice')} />
        </View>
      </ScrollView>
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
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
  secondCard: {
    marginTop: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  cardText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
