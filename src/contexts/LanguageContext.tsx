import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, TranslationKey } from '../i18n/translations';

export type UiLanguage = 'en' | 'es';

const STORAGE_KEY = 'ui_language';

interface LanguageContextValue {
  uiLanguage: UiLanguage;
  setUiLanguage: (lang: UiLanguage) => void;
  syncFromNativeLanguage: (lang: UiLanguage) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [uiLanguage, setUiLanguageState] = useState<UiLanguage>('es');
  // Si el usuario ya eligió idioma a mano (el toggle, o quedó guardado de una
  // sesión anterior), esa elección manda sobre lo que diga native_language al
  // iniciar sesión.
  const [manuallySet, setManuallySet] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'es') {
        setUiLanguageState(stored);
        setManuallySet(true);
      }
    });
  }, []);

  const setUiLanguage = useCallback((lang: UiLanguage) => {
    setUiLanguageState(lang);
    setManuallySet(true);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const syncFromNativeLanguage = useCallback(
    (lang: UiLanguage) => {
      if (!manuallySet) {
        setUiLanguageState(lang);
      }
    },
    [manuallySet]
  );

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let str: string = translations[uiLanguage][key] ?? translations.es[key] ?? key;
      if (vars) {
        for (const [varKey, value] of Object.entries(vars)) {
          str = str.replace(`{${varKey}}`, String(value));
        }
      }
      return str;
    },
    [uiLanguage]
  );

  return (
    <LanguageContext.Provider value={{ uiLanguage, setUiLanguage, syncFromNativeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
