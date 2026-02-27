import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';

i18n
    .use(LanguageDetector)     // Détecte la langue du navigateur
    .use(initReactI18next)     // Injecte dans React
    .init({
        resources: {
            fr: { translation: fr },
            en: { translation: en },
        },
        fallbackLng: 'fr',        // Français par défaut
        interpolation: {
            escapeValue: false,      // React gère déjà l'échappement XSS
        },
        detection: {
            // Ordre de détection : localStorage > navigateur
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'idle_language',
        },
    });

export default i18n;
