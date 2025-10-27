export const locales = ['es', 'en'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'es';

export const localeNames = {
  es: 'Español (Bolivia)',
  en: 'English (USA)'
} as const;

export const localeFlags = {
  es: '🇧🇴',
  en: '🇺🇸'
} as const;
