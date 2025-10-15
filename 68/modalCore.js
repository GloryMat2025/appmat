// Tiny modal engine: create, open/close, focus trap, ESC/Backdrop close
export function createModal({ title, content, actions, ariaLabel }) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  const host = document.createElement("div");
  host.className = "modal";
  host.setAttribute("role", "dialog");
  host.setAttribute("aria-modal", "true");
  if (ariaLabel) host.setAttribute("aria-label", ariaLabel);

  const panel = document.createElement("div");
  panel.className = "panel";

  const header = document.createElement("div");
  header.className = "modal-header";
  const h = document.createElement("h3");
  h.className = "modal-title";
  h.textContent = title;
  const close = document.createElement("button");
  close.className = "modal-close";
  close.setAttribute("aria-label", "Close");
  close.innerHTML = "×";
  header.appendChild(h);
  header.appendChild(close);

  const body = document.createElement("div");
  body.className = "modal-body";
  body.append(...(Array.isArray(content) ? content : [content]));

  const footer = document.createElement("div");
  footer.className = "modal-footer";
  (actions || []).forEach((btn) => footer.appendChild(btn));

  panel.append(header, body, footer);
  host.appendChild(panel);

  let previousActive = null;
  const trap = (e) => {
    const focusables = host.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  function open() {
    previousActive = document.activeElement;
    document.body.append(backdrop, host);
    // Force reflow to enable transition
    // eslint-disable-next-line no-unused-expressions
    backdrop.offsetHeight; host.offsetHeight;
    backdrop.classList.add("open");
    host.classList.add("open");
    panel.querySelector(".modal-close")?.focus();
    window.addEventListener("keydown", onKey);
    host.addEventListener("keydown", trap);
    backdrop.addEventListener("click", closeModal);
  }

  function closeModal() {
    backdrop.classList.remove("open");
    host.classList.remove("open");
    window.removeEventListener("keydown", onKey);
    host.removeEventListener("keydown", trap);
    backdrop.removeEventListener("click", closeModal);
    setTimeout(() => { backdrop.remove(); host.remove(); previousActive?.focus?.(); }, 180);
  }

  function onKey(e) {
    if (e.key === "Escape") closeModal();
  }

  close.addEventListener("click", closeModal);

  return { open, close: closeModal, host, panel, body, footer };
}
