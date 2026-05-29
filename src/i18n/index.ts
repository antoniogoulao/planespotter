import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import enUS from './locales/en-US.json';
import enGB from './locales/en-GB.json';
import frFR from './locales/fr-FR.json';
import ptPT from './locales/pt-PT.json';
import ptBR from './locales/pt-BR.json';
import esES from './locales/es-ES.json';
import deDE from './locales/de-DE.json';
import itIT from './locales/it-IT.json';

const resources = {
  'en-US': { translation: enUS }, 'en-GB': { translation: enGB },
  'fr-FR': { translation: frFR }, 'pt-PT': { translation: ptPT },
  'pt-BR': { translation: ptBR }, 'es-ES': { translation: esES },
  'de-DE': { translation: deDE }, 'it-IT': { translation: itIT },
};
export const SUPPORTED = Object.keys(resources);
const STORAGE_KEY = 'lang';

function pickLocale(stored?: string | null): string {
  if (stored && SUPPORTED.includes(stored)) return stored;
  for (const { languageTag } of Localization.getLocales()) {
    if (SUPPORTED.includes(languageTag)) return languageTag;
    const base = languageTag.split('-')[0];
    const region = SUPPORTED.find((s) => s.startsWith(base + '-'));
    if (region) return region;
  }
  return 'en-US';
}

export async function initI18n() {
  if (i18n.isInitialized) return Promise.resolve(i18n);
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  await i18n.use(initReactI18next).init({
    resources,
    lng: pickLocale(stored),
    supportedLngs: SUPPORTED,
    fallbackLng: { 'en-GB': ['en-US'], 'pt-BR': ['pt-PT'], 'pt-PT': ['pt-BR'], default: ['en-US'] },
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return i18n;
}

export async function setLanguage(tag: string) {
  await AsyncStorage.setItem(STORAGE_KEY, tag);
  await i18n.changeLanguage(tag);
}
export default i18n;
