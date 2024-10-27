import i18next from "i18next";
import { initReactI18next } from "react-i18next";

const defaultLocale = "en";

export async function initI18n() {
  await i18next
    .use(initReactI18next)
    .init({
      lng: defaultLocale,
      fallbackLng: defaultLocale,
      supportedLngs: [defaultLocale],
      interpolation: {
        escapeValue: false,
      },
      resources: {
        en: { translation: await import('../locales/en.json') },
      },
    });

  return i18next;
}
