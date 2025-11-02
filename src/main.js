import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("app-root");
  if (root) {
    root.innerHTML = `
      <section class="welcome">
        <h1>Welcome to AppMat 🎉</h1>
        <p>AppMat is running successfully in ${import.meta.env.MODE} mode.</p>
      </section>
    `;
  } else {
    console.error("❌ #app-root not found");
  }
});
