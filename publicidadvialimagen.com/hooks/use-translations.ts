'use client';

import { useTranslationContext } from '@/components/translation-provider';

export function useTranslations() {
  const { locale, setLocale, t, isClient } = useTranslationContext();
  
  return {
    locale,
    setLocale,
    t,
    isClient
  };
}
