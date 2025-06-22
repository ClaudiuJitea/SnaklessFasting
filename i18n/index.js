import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ro from './locales/ro.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      // Fallback to device locale
      const deviceLocale = Localization.locale;
      return callback(deviceLocale);
    } catch (error) {
      console.log('Error reading language', error);
      return callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    debug: false,
    resources: {
      en: {
        translation: en,
      },
      ro: {
        translation: ro,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;