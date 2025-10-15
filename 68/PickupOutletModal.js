import { createModal } from "./modalCore.js";

const OUTLETS = [
  { id:"kb-01", name:"Kota Bharu Central", region:"Kelantan", address:"Jalan Sultanah Zainab", hours:"10:00–22:00" },
  { id:"kb-02", name:"Wakaf Che Yeh", region:"Kelantan", address:"Jalan Kuala Krai", hours:"11:00–21:00" },
  { id:"sg-01", name:"Shah Alam Seksyen 13", region:"Selangor", address:"Stadium Ave", hours:"10:00–22:00" },
  { id:"sg-02", name:"Gombak Taman Greenwood", region:"Selangor", address:"Greenwood Ave", hours:"09:00–21:00" },
  { id:"jh-01", name:"Johor Bahru Southkey", region:"Johor", address:"Southkey Mall", hours:"10:00–22:00" },
];

export function PickupOutletModal({ onSave } = {}) {
  const search = document.createElement("input");
  search.className = "input"; search.placeholder = "Search outlet or region…";

  const content = [
    field("", search, "Type to filter by name or region. Click an outlet to select."),
    listContainer()
  ];

  const btnCancel = button("Close", "ghost");
  const modal = createModal({ title: "Select Pickup Outlet", content, actions: [btnCancel], ariaLabel: "Pickup outlet selector" });
  btnCancel.addEventListener("click", modal.close);

  const container = content[1];
  function renderList(filter = "") {
    container.innerHTML = "";
    const q = filter.trim().toLowerCase();

    const grouped = OUTLETS.reduce((acc, o) => {
      if (q && !(o.name.toLowerCase().includes(q) || o.region.toLowerCase().includes(q))) return acc;
      (acc[o.region] ||= []).push(o); return acc;
    }, {});

    const wrapper = document.createElement("div");
    wrapper.className = "outlet-list";

    Object.entries(grouped).forEach(([region, items]) => {
      const group = document.createElement("div"); group.className = "outlet-group";
      const title = document.createElement("h4"); title.textContent = region;
      group.appendChild(title);
      items.forEach(o => group.appendChild(row(o)));
      wrapper.appendChild(group);
    });

    if (!Object.keys(grouped).length) {
      const empty = document.createElement("div");
      empty.style.padding = "14px"; empty.textContent = "No outlets found.";
      wrapper.appendChild(empty);
    }

    container.appendChild(wrapper);
  }

  function row(o) {
    const item = document.createElement("div"); item.className = "outlet-item";
    const left = document.createElement("div");
    const nm = document.createElement("div"); nm.className = "outlet-name"; nm.textContent = o.name;
    const mt = document.createElement("div"); mt.className = "outlet-meta"; mt.textContent = `${o.address} • ${o.hours}`;
    left.append(nm, mt);

    const choose = document.createElement("button"); choose.className = "btn primary"; choose.textContent = "Select";
    choose.addEventListener("click", () => { onSave?.(o); modal.close(); });

    item.append(left, choose);
    return item;
  }

  search.addEventListener("input", () => renderList(search.value));
  renderList();

  return modal;
}

function field(labelText, control, helper) {
  const wrap = document.createElement("div");
  if (labelText) {
    const label = document.createElement("div"); label.className = "label"; label.textContent = labelText; wrap.appendChild(label);
  }
  wrap.appendChild(control);
  if (helper) {
    const hp = document.createElement("div"); hp.className = "helper"; hp.textContent = helper;
    wrap.appendChild(hp);
  }
  return wrap;
}
function button(text, variant) {
  const b = document.createElement("button");
  b.className = "btn " + (variant || "");
  b.textContent = text;
  return b;
}
function listContainer(){ const d = document.createElement("div"); return d; }
