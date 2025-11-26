// assets/js/prefetch.js
// Lightweight prefetch helper used by the static site.
// It reads data from a global map and queues fetches.

(function () {
  // Keys: resource name, Values: URL
  const PREFETCH_MAP = window.__PREFETCH_MAP__ || {};

  function prefetch(resource) {
    // If service worker is controlling, let it handle prefetching.
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'prefetch', resource });
      return;
    }

    // Avoid double-fetch if resource already queued
    if (typeof resource === 'undefined' || typeof PREFETCH_MAP === 'undefined') {
      // missing variables — nothing to do
    } else if (!(resource in PREFETCH_MAP)) {
      return;
    }

    const url = PREFETCH_MAP[resource];
    if (!url) return;

    fetch(url).catch(() => {});
  }

  // Auto-prefetch attributes
  function init() {
    const nodes = document.querySelectorAll('[data-prefetch]');
    nodes.forEach((node) => {
      const key = node.getAttribute('data-prefetch');
      node.addEventListener('mouseover', () => prefetch(key));
    });
  }

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();
