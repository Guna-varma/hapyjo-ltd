import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { createT, type Locale } from '@/field-ops/lib/i18n';
import { setFriendlyErrorLocale } from '@/field-ops/lib/friendlyError';

const LOCALE_STORAGE_KEY = '@hapyjo_locale';

/**
 * Web port: the persisted locale moves from AsyncStorage to localStorage (same key
 * and values, so behaviour is unchanged). Both accessors are guarded because
 * localStorage throws in private-mode / blocked-storage contexts.
 */
const localeStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set(value: string): void {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, value);
    } catch {
      // ignore (storage unavailable)
    }
  },
};

type TFunction = (key: string) => string;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localeStorage.get();
    if (stored === 'en' || stored === 'rn') setLocaleState(stored);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localeStorage.set(l);
  }, []);

  const t = useMemo(() => createT(locale), [locale]);
  // Alert dialogs translate raw errors outside React; keep them in the same language.
  useEffect(() => {
    setFriendlyErrorLocale(locale);
  }, [locale]);
  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
