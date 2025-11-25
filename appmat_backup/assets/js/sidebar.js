export function setupSidebar() {
  const btn = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (!(btn && sidebar && overlay)) return;

  const toggleSidebar = () => {
    const isActive = sidebar.classList.toggle("active");
    overlay.classList.toggle("hidden");
    overlay.classList.toggle("active");
    btn.textContent = isActive ? "✕" : "☰";
    document.body.style.overflow = isActive ? "hidden" : "";
  };

  btn.addEventListener("click", toggleSidebar);
  overlay.addEventListener("click", toggleSidebar);

  console.log("✅ Sidebar ready.");
}
