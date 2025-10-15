// src/components/modals/CommandPalette.js
import { searchCommands } from "../../utils/commands.js";

export function CommandPalette() {
  const overlay = document.createElement("div");
  overlay.className = "cmd-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Command palette");

  const panel = document.createElement("div");
  panel.className = "cmd-panel";
  panel.innerHTML = `
    <input class="cmd-input" id="cmdInput" type="text"
      placeholder="Type to search… (↑/↓ select, Enter run, Esc close)"
      aria-label="Command search"/>
    <div class="cmd-list" id="cmdList" role="listbox" aria-label="Commands"></div>
  `;
  overlay.appendChild(panel);

  let idx = 0;
  let items = [];

  function render() {
    const list = panel.querySelector("#cmdList");
    list.innerHTML = "";
    if (!items.length) { list.innerHTML = `<div class="cmd-empty">No results</div>`; return; }

    // group by cmd.group for nicer scanning
    const groups = {};
    items.forEach(c => {
      const g = c.group || "Commands";
      (groups[g] ||= []).push(c);
    });

    Object.keys(groups).forEach(groupName => {
      const head = document.createElement("div");
      head.className = "helper";
      head.style.cssText = "padding:6px 12px; text-transform:uppercase; letter-spacing:.04em; font-size:12px;";
      head.textContent = groupName;
      list.appendChild(head);

      groups[groupName].forEach((c) => {
        const i = items.indexOf(c);
        const el = document.createElement("div");
        el.className = "cmd-item";
        el.setAttribute("role", "option");
        el.setAttribute("aria-selected", String(i===idx));
        el.innerHTML = `
          <div>${escapeHtml(c.title)} ${c.hint ? `<span class="helper">— ${escapeHtml(c.hint)}</span>` : ""}</div>
          <div class="k">${escapeHtml(c.kb || "")}</div>`;
        el.addEventListener("click", ()=> run(i));
        list.appendChild(el);
      });
    });
  }

  function run(i) {
    if (!items[i]) return;
    const fn = items[i].run;
    close();
    setTimeout(()=> fn(), 0);
  }

  function open() {
    if (!overlay.isConnected) document.body.appendChild(overlay);
    overlay.classList.add("open");
    idx = 0; updateResults("");
    const input = panel.querySelector("#cmdInput");
    input.value = ""; input.focus(); input.select();
  }
  function close(){ overlay.classList.remove("open"); try{document.activeElement.blur();}catch{} }

  async function updateResults(q){
    items = await searchCommands(q);
    idx = 0; render();
  }

  panel.addEventListener("keydown", (e)=>{
    if (e.key === "Escape") { e.preventDefault(); close(); }
    if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(items.length-1, idx+1); render(); }
    if (e.key === "ArrowUp")   { e.preventDefault(); idx = Math.max(0, idx-1); render(); }
    if (e.key === "Enter")     { e.preventDefault(); run(idx); }
  });
  panel.querySelector("#cmdInput").addEventListener("input", (e)=> updateResults(e.target.value||""));

  return { open, close, root: overlay };
}
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&gt;","\"":"&quot;","'":"&#39;", ">":"&gt;"})[m]); }
