import { createModal } from "./modalCore.js";
import { parseLatLng } from "../../utils/geo.js";

export function DeliveryAddressModal({ onSave } = {}) {
  const name = input({ placeholder: "Full name" });
  const phone = input({ placeholder: "Phone (e.g., 012-3456789)" });
  const addr1 = input({ placeholder: "Address line 1" });
  const addr2 = input({ placeholder: "Address line 2 (optional)" });
  const row = document.createElement("div"); row.className = "row";
  const city = input({ placeholder: "City" });
  const postcode = input({ placeholder: "Postcode" });
  row.append(city, postcode);
  const state = select(["Kelantan","Kedah","Selangor","Johor","Pahang","Perak","Sabah","Sarawak","WP Kuala Lumpur","WP Putrajaya","WP Labuan"]);

  const lat = input({ placeholder: "Latitude (e.g., 3.1390)" });
  const lng = input({ placeholder: "Longitude (e.g., 101.6869)" });
  const latLngRow = document.createElement("div");
  latLngRow.style.display = "flex";
  latLngRow.style.gap = "8px";
  latLngRow.style.flexWrap = "wrap";
  latLngRow.append(lat, lng);

  const content = [
    field("Name", name),
    field("Phone", phone),
    field("Address", addr1),
    field("", addr2),
    row,
    field("State", state, "Choose a state"),
    (() => {
      const wrap = document.createElement("div");
      const helper = document.createElement("div");
      helper.className = "helper";
      helper.textContent = "If available, enter coordinates (lat,lng) for precise delivery fee.";
      wrap.appendChild(helper);
      wrap.appendChild(latLngRow);
      return wrap;
    })(),
  ];

  const btnCancel = button("Cancel", "ghost");
  const btnSave = button("Save Address", "primary");

  const modal = createModal({ title: "Set Delivery Address", content, actions: [btnCancel, btnSave], ariaLabel: "Delivery address form" });

  btnCancel.addEventListener("click", modal.close);
  btnSave.addEventListener("click", () => {
    const payload = {
      name: name.value.trim(),
      phone: phone.value.trim(),
      address1: addr1.value.trim(),
      address2: addr2.value.trim(),
      city: city.value.trim(),
      postcode: postcode.value.trim(),
      state: state.value,
    };
    // simple validation
    if (!payload.name || !payload.phone || !payload.address1 || !payload.city || !payload.postcode || !payload.state) {
      alert("Please fill in all required fields.");
      return;
    }
    // Parse lat/lng fields and address1
    const latVal = Number(lat.value || NaN);
    const lngVal = Number(lng.value || NaN);
    const m = parseLatLng(addr1.value);
    const coords = Number.isFinite(latVal) && Number.isFinite(lngVal) ? { lat: latVal, lng: lngVal } : (m || {});
    onSave?.({ ...payload, ...coords });
    modal.close();
  });

  return modal;
}

function field(labelText, control, helper) {
  const wrap = document.createElement("div");
  const label = document.createElement("div");
  label.className = "label"; label.textContent = labelText;
  wrap.appendChild(label);
  wrap.appendChild(control);
  if (helper) {
    const hp = document.createElement("div"); hp.className = "helper"; hp.textContent = helper;
    wrap.appendChild(hp);
  }
  return wrap;
}
function input({ placeholder }) {
  const el = document.createElement("input");
  el.className = "input"; el.placeholder = placeholder || "";
  return el;
}
function select(options) {
  const el = document.createElement("select"); el.className = "select";
  const optBlank = document.createElement("option");
  optBlank.value = ""; optBlank.textContent = "Select…"; el.appendChild(optBlank);
  options.forEach(o => { const opt = document.createElement("option"); opt.value = o; opt.textContent = o; el.appendChild(opt); });
  return el;
}
function button(text, variant) {
  const b = document.createElement("button");
  b.className = "btn " + (variant || "");
  b.textContent = text;
  return b;
}
