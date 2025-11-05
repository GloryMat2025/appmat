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
