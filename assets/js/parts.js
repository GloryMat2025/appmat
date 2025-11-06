// Load [site-part] components dynamically
export async function loadAllParts() {
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

  const parts = document.querySelectorAll("[site-part]");
  await Promise.all(
    Array.from(parts).map((el) => {
      const tag = el.tagName.toLowerCase();
      const src = el.getAttribute("data-src") || `/components/${tag}.html`;
      return loadComponent(`${tag}[site-part]`, src);
    })
  );

  console.log("✅ Components loaded successfully.");
}
