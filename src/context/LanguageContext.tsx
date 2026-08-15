"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "@/lib/i18n";
import { useToast } from "@/context/ToastContext";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations.en) => string;
  tCategory: (category?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("namma_thanjai_lang", "en");
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState("en");
    if (typeof window !== "undefined") {
      localStorage.setItem("namma_thanjai_lang", "en");
    }
  };

  const toggleLanguage = () => {
    setLang("en");
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations.en[key] || String(key);
  };

  const tCategory = (category?: string): string => {
    return category || "";
  };

  return (
    <LanguageContext.Provider value={{ lang: "en", setLang, toggleLanguage, t, tCategory }}>
      {children}
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
