// assets/js/prefetch.js
export function prefetchComponents() {
  if (!"requestIdleCallback" in window) return;

  requestIdleCallback(() => {
    const urls = [
      "/components/header.html",
      "/components/footer.html",
      "/components/sidebar.html",
    ];

    urls.forEach((url) => {
      fetch(url, { method: "GET", cache: "force-cache" })
        .then(() => console.log(`🟢 Prefetched: ${url}`))
        .catch(() => console.warn(`⚠️ Prefetch failed: ${url}`));
    });
  });
}
