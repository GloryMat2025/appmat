export function setupTheme() {
  const btn = document.getElementById("theme-toggle");

  const applyTheme = (mode) => {
    document.body.classList.toggle("dark", mode === "dark");
    if (btn)
      btn.textContent =
        mode === "dark" ? "☀️ Tukar ke Light Mode" : "🌙 Tukar ke Dark Mode";
    localStorage.setItem("theme", mode);
  };

  let saved = localStorage.getItem("theme");
  if (!saved) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    saved = prefersDark ? "dark" : "light";
  }
  applyTheme(saved);

  if (btn) {
    btn.addEventListener("click", () => {
      const newMode = document.body.classList.contains("dark") ? "light" : "dark";
      applyTheme(newMode);
    });
  }

  console.log("✅ Theme toggle active.");
}
