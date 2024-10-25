import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { match } from "@formatjs/intl-localematcher";
import { shouldPolyfill as shouldPolyfillLocale } from "@formatjs/intl-locale/should-polyfill";
import { shouldPolyfill as shouldPolyfillPluralRules } from "@formatjs/intl-pluralrules/should-polyfill";

const defaultLocale = "en";
const supportedLocales = ["en", "fr", "de", "es"];

export async function initI18n() {
  // Polyfill if needed
  if (shouldPolyfillLocale()) {
    await import("@formatjs/intl-locale/polyfill");
  }
  if (shouldPolyfillPluralRules()) {
    await import("@formatjs/intl-pluralrules/polyfill");
  }

  const userLocale = match(
    navigator.languages,
    supportedLocales,
    defaultLocale
  );

  await i18next
    .use(initReactI18next)
    .use(
      resourcesToBackend((language, namespace) =>
        import(`../locales/${language}.json`)
      )
    )
    .init({
      lng: userLocale,
      fallbackLng: defaultLocale,
      supportedLngs: supportedLocales,
      interpolation: {
        escapeValue: false,
      },
    });

  return i18next;
}
