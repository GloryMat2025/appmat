// 🌍 Detect environment (DEV / PROD)
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

if (isDev) {
  console.log('🔧 AppMat running in DEV mode');
  import('/src/main.js');
} else {
  console.log('🚀 AppMat running in PROD mode');
  const script = document.createElement('script');
  script.type = 'module';
  script.defer = true;
  script.src = '/assets/js/app.js';
  document.head.appendChild(script);
}

// Wait for DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  // 🔹 Helper to load component by selector + URL
  const loadComponent = async (selector, url) => {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load ${url}`);
      el.innerHTML = await res.text();
    } catch (err) {
      console.error(`Error loading ${url}:`, err);
    }
  };

  // 🧩 Auto-load all [site-part] sections
  const parts = document.querySelectorAll('[site-part]');
  await Promise.all(
    Array.from(parts).map((el) => {
      const tag = el.tagName.toLowerCase();
      const src = el.getAttribute('data-src') || `/components/${tag}.html`;
      return loadComponent(`${tag}[site-part]`, src);
    })
  );

  console.log('✅ All site-part components loaded successfully.');

  // =========================================
  // 🔸 Sidebar Toggle Logic (single instance)
  // =========================================
  const sidebarBtn = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  if (sidebarBtn && sidebar && overlay) {
    const toggleSidebar = () => {
      const isActive = sidebar.classList.toggle('active');
      overlay.classList.toggle('hidden');
      overlay.classList.toggle('active');
      sidebarBtn.textContent = isActive ? '✕' : '☰';
      document.body.style.overflow = isActive ? 'hidden' : '';
    };

    sidebarBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
  }

  // =========================================
  // 🌗 Theme Toggle + System Preference
  // =========================================
  const themeToggle = document.getElementById('theme-toggle');

  const applyTheme = (mode) => {
    if (mode === 'dark') {
      document.body.classList.add('dark');
      if (themeToggle) themeToggle.textContent = '☀️ Tukar ke Light Mode';
    } else {
      document.body.classList.remove('dark');
      if (themeToggle) themeToggle.textContent = '🌙 Tukar ke Dark Mode';
    }
    localStorage.setItem('theme', mode);
  };

  // Check saved theme
  let savedTheme = localStorage.getItem('theme');
  if (!savedTheme) {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    savedTheme = systemPrefersDark ? 'dark' : 'light';
  }

  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      applyTheme(isDark ? 'dark' : 'light');
    });
  }
});
