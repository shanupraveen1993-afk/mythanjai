"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations, getTamilCategory } from "@/lib/i18n";
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
      const saved = localStorage.getItem("namma_thanjai_lang") as Language;
      if (saved === "ta" || saved === "en") {
        setLangState(saved);
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("namma_thanjai_lang", newLang);
    }
  };

  const toggleLanguage = () => {
    const nextLang: Language = lang === "en" ? "ta" : "en";
    setLang(nextLang);
    toast.success(nextLang === "ta" ? translations.ta.switchedToTamil : translations.en.switchedToEnglish);
  };

  const t = (key: keyof typeof translations.en): string => {
    const langDict = translations[lang] || translations.en;
    return langDict[key] || translations.en[key] || String(key);
  };

  const tCategory = (category?: string): string => {
    if (!category) return "";
    if (lang === "ta") {
      const taName = getTamilCategory(category);
      return taName !== category ? `${category} • ${taName}` : category;
    }
    return category;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t, tCategory }}>
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
