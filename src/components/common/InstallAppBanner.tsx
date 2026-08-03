import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../hooks/useLanguage';
import { spacing, colors, vibrant } from '../../constants/theme';

// Solo tiene sentido en la versión web (la que corre en el navegador del
// celular) — en la app nativa ya está "instalada" por definición.
const IS_WEB = Platform.OS === 'web';

function isStandalone(): boolean {
  if (!IS_WEB || typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;
}

function isIos(): boolean {
  if (!IS_WEB || typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppBanner() {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (!IS_WEB || isStandalone()) return;

    if (isIos()) {
      setShowIosHint(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!IS_WEB || dismissed || isStandalone() || (!deferredPrompt && !showIosHint)) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name="download-outline" size={18} color={vibrant.purple} />
      </View>
      <Text style={styles.text}>{showIosHint ? t('installApp.iosHint') : t('installApp.prompt')}</Text>
      {deferredPrompt ? (
        <Pressable onPress={handleInstall} style={styles.installButton}>
          <Text style={styles.installButtonText}>{t('installApp.button')}</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={() => setDismissed(true)} hitSlop={8} style={styles.closeButton}>
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    maxWidth: 340,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
    ...Platform.select({
      default: { boxShadow: '0 4px 12px rgba(59, 7, 100, 0.08)' },
    }),
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  installButton: {
    backgroundColor: vibrant.purple,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  installButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 2,
  },
});
