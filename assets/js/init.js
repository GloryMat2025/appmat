// Detect environment
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

if (isDev) {
  console.log('🔧 AppMat running in DEV mode');
  import('/src/main.js');
} else {
  console.log('🚀 AppMat running in PROD mode');
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/assets/js/app.js';
  document.head.appendChild(script);
}

// Wait until DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
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

  // 🧠 Dynamically detect all site-part elements
  const parts = document.querySelectorAll('[site-part]');
  await Promise.all(
    Array.from(parts).map((el) => {
      const tag = el.tagName.toLowerCase();
      const src = el.getAttribute('data-src') || `/components/${tag}.html`;
      return loadComponent(`${tag}[site-part]`, src);
    })
  );

  console.log('✅ All site-part components loaded successfully.');
});

// ✅ After components are loaded
console.log('✅ Header & Footer loaded successfully.');

// 🔹 Sidebar & menu toggle logic
const toggleButton = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (toggleButton && mobileMenu) {
  toggleButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    toggleButton.textContent = mobileMenu.classList.contains('hidden') ? '☰' : '✕';
  });
}
// After components load successfully
console.log('✅ Header & Footer loaded successfully.');

// Sidebar & menu toggle
const toggleButton = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

if (toggleButton && sidebar && overlay) {
  const toggleSidebar = () => {
    const isActive = sidebar.classList.toggle('active');
    overlay.classList.toggle('hidden');
    overlay.classList.toggle('active');
    toggleButton.textContent = isActive ? '✕' : '☰';

    // 🔹 Lock/unlock scroll pada body
    document.body.style.overflow = isActive ? 'hidden' : '';
  };

  toggleButton.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', toggleSidebar);
}
// Selepas sidebar, header, footer dimuat...
const themeToggle = document.getElementById('theme-toggle');

// Semak tema tersimpan
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
  document.body.classList.add('dark');
  if (themeToggle) themeToggle.textContent = '☀️ Tukar ke Light Mode';
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');

    // Tukar teks & simpan pilihan user
    themeToggle.textContent = isDark ? '☀️ Tukar ke Light Mode' : '🌙 Tukar ke Dark Mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}
// 🌗 Dark Mode System Detection + Toggle
const themeToggle = document.getElementById('theme-toggle');

// Fungsi set tema
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

// 1️⃣ Semak localStorage dulu
let savedTheme = localStorage.getItem('theme');

if (!savedTheme) {
  // 2️⃣ Kalau tiada, ikut sistem (auto detect)
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  savedTheme = systemPrefersDark ? 'dark' : 'light';
}

// 3️⃣ Gunakan tema semasa
applyTheme(savedTheme);

// 4️⃣ Event listener untuk tukar tema manual
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    applyTheme(isDark ? 'dark' : 'light');
  });
}
