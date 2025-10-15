// src/utils/motion.js
const RM_KEY = "myapp.reduceMotion"; // "on" | "off" | "system"

export function getMotionPref() {
  return localStorage.getItem(RM_KEY) || "system";
}
export function setMotionPref(mode) {
  const val = (["on","off","system"].includes(mode)) ? mode : "system";
  localStorage.setItem(RM_KEY, val);
  document.documentElement.setAttribute("data-reduce-motion", val);
}
export function initMotion() {
  setMotionPref(getMotionPref());
  // Re-apply on OS change when in system
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => { if (getMotionPref() === "system") setMotionPref("system"); };
    mq.addEventListener?.("change", handler);
  }
}
export function prefersReducedMotionNow() {
  const pref = getMotionPref();
  if (pref === "on") return true;
  if (pref === "off") return false;
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
