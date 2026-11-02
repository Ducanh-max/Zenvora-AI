"use client";

import { Moon, Sun } from "lucide-react";
import { usePreferences } from "./preferences-provider";
import styles from "./preference-controls.module.css";

export default function PreferenceControls() {
  const { theme, language, setTheme, setLanguage } = usePreferences();
  const themeLabel = language === "vi" ? (theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối") : (theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  const languageLabel = language === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt";
  return <div className={styles.controls} role="group" aria-label={language === "vi" ? "Giao diện và ngôn ngữ" : "Appearance and language"}>
    <button type="button" className={styles.button} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={themeLabel} title={themeLabel}>{theme === "dark" ? <Sun size={16} aria-hidden="true"/> : <Moon size={16} aria-hidden="true"/>}</button>
    <button type="button" className={`${styles.button} ${styles.language}`} onClick={() => setLanguage(language === "vi" ? "en" : "vi")} aria-label={languageLabel} title={languageLabel}>{language.toUpperCase()}</button>
  </div>;
}
