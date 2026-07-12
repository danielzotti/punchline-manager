"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { IntlProvider as ReactIntlProvider } from "react-intl";
import enMessages from "@/i18n/en.json";
import itMessages from "@/i18n/it.json";

const messages = {
  en: enMessages,
  it: itMessages,
};

export type Locale = "en" | "it";

interface LanguageContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("it");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale;
    if (savedLocale === "en" || savedLocale === "it") {
      setLocaleState(savedLocale);
    } else if (typeof navigator !== "undefined") {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "en" || browserLang === "it") {
        setLocaleState(browserLang as Locale);
      }
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  // Prevent hydration mismatch by rendering a simple fallback before client-side mount
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ locale, setLocale }}>
        <ReactIntlProvider locale="it" messages={messages.it} defaultLocale="it">
          <div className="invisible">{children}</div>
        </ReactIntlProvider>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <ReactIntlProvider locale={locale} messages={messages[locale]} defaultLocale="it">
        {children}
      </ReactIntlProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
