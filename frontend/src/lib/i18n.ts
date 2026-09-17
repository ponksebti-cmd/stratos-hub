import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationEN from "../locales/en/translation.json";
import translationAR from "../locales/ar/translation.json";

export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;

const resources = {
  en: {
    translation: translationEN,
  },
  ar: {
    translation: translationAR,
  },
};

// Normalise browser locales like "ar-EG" / "en-US" to our supported codes
function normalizeLng(code: string): string {
  const base = (code || "").toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(base) ? base : "en";
}

const detected =
  typeof window !== "undefined"
    ? normalizeLng(
        window.localStorage.getItem("stratos_lang") ||
          new URLSearchParams(window.location.search).get("lang") ||
          window.navigator.language ||
          "en",
      )
    : "en";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: detected,
    supportedLngs: SUPPORTED_LANGUAGES,
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    fallbackLng: "en",
    returnEmptyString: false,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["localStorage", "cookie"],
    },
  });

// Keep <html lang/dir> in sync (also mirrored in __root.tsx for runtime changes)
if (typeof document !== "undefined") {
  const apply = (lng: string) => {
    const lang = normalizeLng(lng);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("stratos_lang", lang);
    } catch {
      /* private mode — ignore */
    }
  };
  apply(i18n.language);
  i18n.on("languageChanged", apply);
}

export default i18n;
