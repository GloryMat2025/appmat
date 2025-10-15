// src/utils/flags.js
import { getSettings, setSettings } from "./settings.js";

const DEFAULT_FLAGS = {
  pwa: true,
  notifications: true,
  analytics: true,
  backup: true,
  // one-tap master kill (keeps core order flow only)
  coreMode: false,
  tests: true, // Feature flag for in-app test runner
  kds: true, // Feature flag for Kitchen Display System
};

export function getFlags() {
  const s = getSettings();
  return { ...DEFAULT_FLAGS, ...(s.featureFlags || {}) };
}

export function setFlags(patch) {
  const next = { ...getFlags(), ...(patch || {}) };
  // coreMode enforces other flags off at runtime
  if (next.coreMode) {
    next.pwa = false;
    next.notifications = false;
    next.analytics = false;
    next.backup = false;
  }
  setSettings({ featureFlags: next });
  return next;
}

export function isEnabled(key) {
  const f = getFlags();
  if (f.coreMode) return false;
  return !!f[key];
}
