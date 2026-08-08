import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'en-US': { translation: en },
      'pt-BR': { translation: ptBR },
      'pt-br': { translation: ptBR },
      pt: { translation: ptBR },
      'pt-PT': { translation: ptBR },
      es: { translation: es },
      'es-ES': { translation: es },
      'es-419': { translation: es },
    },
    fallbackLng: {
      pt: ['pt-BR', 'en'],
      'pt-br': ['pt-BR', 'en'],
      'pt-PT': ['pt-BR', 'en'],
      default: ['en'],
    },
    supportedLngs: ['en', 'en-US', 'pt', 'pt-BR', 'pt-br', 'pt-PT', 'es', 'es-ES', 'es-419'],
    load: 'currentOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18n_lang',
    },
  });

if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__i18n = i18n;

export default i18n;
