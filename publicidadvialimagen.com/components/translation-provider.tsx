'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Locale, locales, defaultLocale } from '@/lib/i18n';
import { getTranslation } from '@/lib/translations';

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  isClient: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isClient, setIsClient] = useState(false);

  // Marcar que estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cargar locale desde localStorage solo en el cliente
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      try {
        const savedLocale = localStorage.getItem('locale') as Locale;
        if (savedLocale && locales.includes(savedLocale)) {
          setLocaleState(savedLocale);
        }
      } catch (error) {
        console.warn('Error loading locale from localStorage:', error);
      }
    }
  }, [isClient]);

  // Guardar locale en localStorage cuando cambie
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      try {
        localStorage.setItem('locale', locale);
      } catch (error) {
        console.warn('Error saving locale to localStorage:', error);
      }
    }
  }, [locale, isClient]);

  const t = useCallback(
    (key: string) => {
      return getTranslation(locale, key);
    },
    [locale]
  );

  const setLocale = useCallback((newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      setLocaleState(newLocale);
    } else {
      console.warn(`Locale "${newLocale}" is not supported.`);
    }
  }, []);

  return (
    <TranslationContext.Provider
      value={{
        locale,
        setLocale,
        t,
        isClient
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
}
