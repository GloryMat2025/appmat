export function initPushListener() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      const payload = event.data;

      // In-app popup
      alert("🚀 Update: " + payload.title);
    });
  }
}
