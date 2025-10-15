import { setThemeSetting } from "./settings.js";
// Get current theme ("light", "dark", or "system")
export function getTheme() {
  return getThemeSetting();
}

// Set theme and update <html data-theme>
export function setTheme(theme) {
  setThemeSetting(theme);
  const root = document.documentElement;
  if (!theme || theme === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", isDark ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", theme);
  }
}
// src/utils/theme.js
// Early theme initialization for <html data-theme>
import { getThemeSetting } from "./settings.js";

export function initTheme() {
  let theme = "system";
  try {
    theme = getThemeSetting();
  } catch {
    // fallback: try to read from localStorage directly
    const raw = localStorage.getItem("myapp.settings");
    if (raw) {
      try { theme = JSON.parse(raw).theme || "system"; } catch {}
    }
  }
  const root = document.documentElement;
  if (!theme || theme === "system") {
    // Set initial system theme
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", isDark ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", theme);
  }
}
