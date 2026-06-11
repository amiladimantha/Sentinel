"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/types";
import { getDictionary } from "./dictionaries";
import en from "./en.json";

type Dictionary = typeof en;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [t, setT] = useState<Dictionary>(en);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setT(getDictionary(newLocale));
    localStorage.setItem("islandwatch-locale", newLocale);
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
