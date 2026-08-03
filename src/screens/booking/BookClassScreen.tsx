import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { Chip } from '../../components/common/Chip';
import { supabase } from '../../config/supabase';
import { colors, spacing, cardShadow, vibrant } from '../../constants/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'BookClass'>;

const MIN_HOUR = 6;
const MAX_HOUR = 22;
const DAYS_AHEAD = 14;

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(d: Date): string {
  const weekday = d.toLocaleDateString('es', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('es', { month: 'short' });
  return `${weekday} ${day} ${month}`;
}

function formatHourLabel(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

function extractErrorMessage(error: unknown, fallback: string): Promise<string> {
  return (async () => {
    let message = error instanceof Error ? error.message : fallback;
    try {
      const body = await (error as { context?: Response })?.context?.json();
      if (body?.error) message = body.error;
    } catch {
      // se queda con message
    }
    return message;
  })();
}

export function BookClassScreen({ navigation }: Props) {
  const days = useMemo(() => {
    const list: Date[] = [];
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(days[0]);
  const [hour, setHour] = useState(MIN_HOUR);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState<{ date: Date; hour: number } | null>(null);

  const adjustHour = (delta: number) => {
    setHour((prev) => Math.min(MAX_HOUR, Math.max(MIN_HOUR, prev + delta)));
  };

  const handleBook = async () => {
    setBooking(true);
    const { error } = await supabase.functions.invoke('book-class', {
      body: { date: toDateKey(selectedDate), hour },
    });
    setBooking(false);

    if (error) {
      const message = await extractErrorMessage(error, 'No se pudo reservar la clase.');
      Alert.alert('No se pudo reservar', message);
      return;
    }

    setConfirmed({ date: selectedDate, hour });
  };

  if (confirmed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.confirmWrap}>
          <Text style={styles.confirmIcon}>✅</Text>
          <Text style={styles.confirmTitle}>¡Clase reservada!</Text>
          <Text style={styles.confirmDetail}>
            {formatDayLabel(confirmed.date)} · {formatHourLabel(confirmed.hour)}
          </Text>
          <Button label="Listo" onPress={() => navigation.goBack()} style={styles.confirmButton} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backLink} onPress={() => navigation.goBack()}>
          ← Cerrar
        </Text>
        <Text style={styles.title}>Agendar clase</Text>
        <Text style={styles.subtitle}>Elige un día y una hora, y revisamos si está disponible.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>¿Qué día?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
          {days.map((d) => (
            <Chip
              key={toDateKey(d)}
              label={formatDayLabel(d)}
              selected={toDateKey(d) === toDateKey(selectedDate)}
              onPress={() => setSelectedDate(d)}
            />
          ))}
        </ScrollView>

        <Text style={[styles.sectionLabel, styles.hourLabel]}>¿A qué hora?</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => adjustHour(-1)}
            disabled={hour <= MIN_HOUR}
            style={[styles.stepperButton, hour <= MIN_HOUR && styles.stepperButtonDisabled]}
          >
            <Text style={styles.stepperArrow}>◀</Text>
          </Pressable>
          <Text style={styles.stepperValue}>{formatHourLabel(hour)}</Text>
          <Pressable
            onPress={() => adjustHour(1)}
            disabled={hour >= MAX_HOUR}
            style={[styles.stepperButton, hour >= MAX_HOUR && styles.stepperButtonDisabled]}
          >
            <Text style={styles.stepperArrow}>▶</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>La clase dura 1 hora — si esa hora no está libre, te lo decimos y eliges otra.</Text>
      </ScrollView>

      <Button
        label="Verificar y reservar"
        onPress={handleBook}
        loading={booking}
        style={styles.bookButton}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  hourLabel: {
    marginTop: spacing.xl,
  },
  daysRow: {
    paddingBottom: spacing.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
    ...cardShadow,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: vibrant.purple,
  },
  stepperValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    minWidth: 130,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  bookButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  confirmWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  confirmIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  confirmDetail: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  confirmButton: {
    minWidth: 160,
  },
});
