
import { orderStore } from "../store/orderStore.js";

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function createStep(step, index) {
  const li = document.createElement("li");
  li.className = "step";
  li.dataset.step = step;
  li.setAttribute("role", "listitem");

  const head = document.createElement("div");
  head.className = "step-head";

  const dot = document.createElement("div");
  dot.className = "dot";
  dot.textContent = String(index + 1);
  dot.setAttribute("aria-hidden", "true");

  const wrap = document.createElement("div");
  wrap.className = "label-wrap";

  const label = document.createElement("div");
  label.className = "label";
  label.textContent = step.charAt(0).toUpperCase() + step.slice(1);
  label.setAttribute("aria-live", "polite");

  const ts = document.createElement("div");
  ts.className = "ts";
  ts.setAttribute("aria-live", "polite");

  wrap.appendChild(label);
  wrap.appendChild(ts);

  head.appendChild(dot);
  head.appendChild(wrap);
  li.appendChild(head);

  if (index < orderStore.FLOW.length - 1) {
    const conn = document.createElement("div");
    conn.className = "connector";
    conn.setAttribute("aria-hidden", "true");
    li.appendChild(conn);
  }

  return li;
}

function render(container) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "order-steps";


  const ol = document.createElement("ol");
  ol.className = "steps";
  ol.setAttribute("role", "list");
  ol.setAttribute("aria-label", "Order progress");

  orderStore.FLOW.forEach((step, i) => {
    ol.appendChild(createStep(step, i));
  });

  // Add a visually hidden live region for timestamp announcements
  const liveRegion = document.createElement("div");
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.setAttribute("aria-atomic", "true");
  liveRegion.style.position = "absolute";
  liveRegion.style.width = "1px";
  liveRegion.style.height = "1px";
  liveRegion.style.overflow = "hidden";
  liveRegion.style.clip = "rect(1px, 1px, 1px, 1px)";
  liveRegion.id = "ordersteps-live";
  wrapper.appendChild(liveRegion);

  const terminal = document.createElement("div");
  terminal.className = "terminal";
  terminal.id = "terminalBadge";
  terminal.hidden = true;
  const bullet = document.createElement("span");
  bullet.className = "bullet";
  const text = document.createElement("span");
  text.className = "terminal-text";
  terminal.appendChild(bullet);
  terminal.appendChild(text);

  wrapper.appendChild(ol);
  wrapper.appendChild(terminal);
  container.appendChild(wrapper);

  // interactive demo buttons (optional)
  const demo = document.createElement("div");
  demo.className = "stack";
  demo.style.marginTop = "16px";
  ["received", "preparing", "ready", "completed", "cancelled", "failed"].forEach((s) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = s[0].toUpperCase() + s.slice(1);
    b.addEventListener("click", () => orderStore.setStatus(s));
    demo.appendChild(b);
  });
  container.appendChild(demo);

  // initial paint
  update(wrapper);
}

// Improved update function for robust step/connector/terminal handling
function update(wrapper) {
  const state = orderStore.getState();
  const { status, timestamps } = state;

  const isTerminal = orderStore.TERMINALS.includes(status);

  const idx = isTerminal ? orderStore.FLOW.length - 1
                         : Math.max(0, orderStore.FLOW.indexOf(status));

  const steps = wrapper.querySelectorAll(".step");
  const liveRegion = wrapper.querySelector("#ordersteps-live");
  let liveMsg = "";

  // Reset view
  steps.forEach((s, i) => {
    const dot = s.querySelector(".dot");
    const label = s.querySelector(".label");
    const tsEl = s.querySelector(".ts");
    const key = s.dataset.step;

    s.classList.remove("reached");
    dot.classList.remove("dot--reached", "dot--active");
    label.classList.remove("label--reached");
    dot.textContent = String(i + 1);

    // Safe timestamp
    const iso = timestamps?.[key];
    const d = iso ? new Date(iso) : null;
    tsEl.textContent = (d && !Number.isNaN(d.getTime()))
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    // Accessibility: set aria-current for active step
    if (i === idx && !isTerminal) {
      s.setAttribute("aria-current", "step"); // standardized value
      if (d && !Number.isNaN(d.getTime())) {
        liveMsg = `${label.textContent} at ${tsEl.textContent}`;
      }
    } else {
      s.removeAttribute("aria-current");
    }

    const conn = s.querySelector(".connector");
    if (conn) conn.classList.remove("connector--reached");
  });

  // Announce timestamp for current step
  if (liveRegion && liveMsg) {
    liveRegion.textContent = liveMsg;
  }

  // Mark reached + connectors
  steps.forEach((s, i) => {
    const dot = s.querySelector(".dot");
    const label = s.querySelector(".label");
    const conn = s.querySelector(".connector");

    if (i < idx) {
      s.classList.add("reached");
      dot.classList.add("dot--reached");
      dot.textContent = "✓";
      label.classList.add("label--reached");
      if (conn) conn.classList.add("connector--reached");
    } else if (i === idx && !isTerminal) {
      s.classList.add("reached");
      dot.classList.add("dot--reached", "dot--active");
      dot.textContent = "✓";
      label.classList.add("label--reached");
      if (conn) conn.classList.toggle("connector--reached", true);
    } else {
      // leave future steps neutral
    }
  });

  // Terminal badge behavior
  const badge = wrapper.querySelector("#terminalBadge");
  if (isTerminal) {
    badge.hidden = false;
    badge.dataset.type = status;
    badge.querySelector(".terminal-text").textContent =
      status.charAt(0).toUpperCase() + status.slice(1);

    // Visually “pin” the connectors up to the last step,
    // but don’t show an active halo (already handled above)
    const beforeLast = wrapper.querySelectorAll(".step");
    beforeLast.forEach((s, i) => {
      const conn = s.querySelector(".connector");
      if (conn && i < orderStore.FLOW.length - 1) conn.classList.add("connector--reached");
    });
  } else {
    badge.hidden = true;
  }
}

export const OrderSteps = {
  mount(container) {
    render(container);
    const wrapper = container.querySelector(".order-steps")?.parentElement; // frozen reference
    const unsub = orderStore.subscribe(() => { if (wrapper) update(wrapper); });
    return () => unsub && unsub();
  },
};
