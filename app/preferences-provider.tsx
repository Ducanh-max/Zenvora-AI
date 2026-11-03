"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { flushSync } from "react-dom";
import { transitionTheme } from "./theme-transition";

export type Language = "vi" | "en";
export type Theme = "dark" | "light";
type Preferences = { language: Language; theme: Theme; setLanguage: (value: Language) => void; setTheme: (value: Theme) => void };
const Context = createContext<Preferences | null>(null);

function apply(theme: Theme, language: Language) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.language = language;
  root.lang = language;
  root.style.colorScheme = theme;
}

export default function PreferencesProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const changingTheme = useRef(false);
  const [theme, updateTheme] = useState<Theme>("dark");
  const [language, updateLanguage] = useState<Language>("vi");
  useEffect(() => {
    function read() {
      let nextTheme: Theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
      let nextLanguage: Language = document.documentElement.lang === "en" ? "en" : "vi";
      try {
        const storedTheme = localStorage.getItem("aunora_theme");
        const storedLanguage = localStorage.getItem("aunora_language");
        if (storedTheme === "dark" || storedTheme === "light") nextTheme = storedTheme;
        if (storedLanguage === "vi" || storedLanguage === "en") nextLanguage = storedLanguage;
      } catch { /* Preferences still work when browser storage is unavailable. */ }
      apply(nextTheme, nextLanguage); updateTheme(nextTheme); updateLanguage(nextLanguage);
    }
    function storageChanged(event: StorageEvent) {
      if (event.key === "aunora_theme" || event.key === "aunora_language" || event.key === null) read();
    }
    read();
    window.addEventListener("storage", storageChanged);
    return () => window.removeEventListener("storage", storageChanged);
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/" || pathname === "/login" || pathname === "/register") document.title = language === "vi" ? "AUNORA — Học tiếng Anh cùng AI" : "AUNORA — Learn English with AI";
  }, [language, pathname]);

  const setTheme = useCallback((value: Theme) => {
    if (changingTheme.current || document.documentElement.dataset.theme === value) return;
    changingTheme.current = true;
    void transitionTheme(value, () => {
      flushSync(() => {
        updateTheme(value);
        document.documentElement.dataset.theme = value;
        document.documentElement.style.colorScheme = value;
      });
      try { localStorage.setItem("aunora_theme", value); } catch { /* Session preference remains active. */ }
    }).finally(() => { changingTheme.current = false; });
  }, []);
  const setLanguage = useCallback((value: Language) => {
    updateLanguage(value); document.documentElement.dataset.language = value; document.documentElement.lang = value;
    try { localStorage.setItem("aunora_language", value); } catch { /* Session preference remains active. */ }
    window.dispatchEvent(new CustomEvent("aunora-language-change", { detail: value }));
  }, []);
  const value = useMemo(() => ({ language, theme, setLanguage, setTheme }), [language, theme, setLanguage, setTheme]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("PreferencesProvider is missing");
  return value;
}
