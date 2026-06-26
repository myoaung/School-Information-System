import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '../locales/en';
import mm from '../locales/mm';

const LanguageContext = createContext(null);

const locales = { en, mm };

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    return localStorage.getItem('locale') || 'mm';
  });

  useEffect(() => {
    localStorage.setItem('locale', locale);
    document.documentElement.lang = locale === 'mm' ? 'my' : 'en';
  }, [locale]);

  const setLocale = useCallback((lang) => {
    setLocaleState(lang);
  }, []);

  const t = useCallback((key, params = {}) => {
    const messages = locales[locale] || locales.en;
    const keys = key.split('.');
    let value = keys.reduce((obj, k) => obj?.[k], messages);

    if (value === undefined || value === null) {
      // Fallback to English
      value = keys.reduce((obj, k) => obj?.[k], locales.en);
      if (value === undefined || value === null) return key;
    }

    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
    }

    return value;
  }, [locale]);

  const formatDate = useCallback((dateStr, options = {}) => {
    const date = new Date(dateStr);
    const loc = locale === 'mm' ? 'my-MM' : 'en-US';
    return date.toLocaleDateString(loc, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    });
  }, [locale]);

  const formatDateShort = useCallback((dateStr) => {
    const date = new Date(dateStr);
    const loc = locale === 'mm' ? 'my-MM' : 'en-US';
    return date.toLocaleDateString(loc, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [locale]);

  const value = { locale, setLocale, t, formatDate, formatDateShort };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
