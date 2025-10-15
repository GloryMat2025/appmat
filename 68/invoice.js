import { getSettings, setSettings } from "./settings.js";

const SEQ_KEY = "myapp.invoiceSeq";          // global sequential
const DATESEQ_KEY = "myapp.invoiceDateSeq";  // { yyyymmdd: nextNumber }
const INV_STORE = "myapp.invoices";          // Array<InvoiceRecord>

function loadStore() {
  try { return JSON.parse(localStorage.getItem(INV_STORE)) || []; } catch { return []; }
}
function saveStore(arr) { localStorage.setItem(INV_STORE, JSON.stringify(arr)); }

// Numbering
function pad(n, w=5){ return String(n).padStart(w, "0"); }
function todayStamp(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const dd= String(d.getDate()).padStart(2,"0");
  return `${y}${m}${dd}`;
}

export function getNextInvoiceNumber() {
  const s = getSettings();
  const prefix = s.invoicePrefix || "INV-";
  const scheme = s.invoiceScheme || "sequential"; // "sequential" | "date"

  if (scheme === "date") {
    // INV-YYYYMMDD-#### (resets daily)
    const stamp = todayStamp();
    let map = {};
    try { map = JSON.parse(localStorage.getItem(DATESEQ_KEY)) || {}; } catch {}
    const next = (map[stamp] || 1);
    const num = `${prefix}${stamp}-${pad(next, 4)}`;
    return { num, seq: next, stamp };
  } else {
    // simple sequential
    const seq = Number(localStorage.getItem(SEQ_KEY) || s.invoiceNext || 1);
    const num = `${prefix}${pad(seq, 5)}`;
    return { num, seq };
  }
}

export function bumpInvoiceSequence() {
  const s = getSettings();
  const scheme = s.invoiceScheme || "sequential";
  if (scheme === "date") {
    const stamp = todayStamp();
    let map = {};
    try { map = JSON.parse(localStorage.getItem(DATESEQ_KEY)) || {}; } catch {}
    const cur = map[stamp] || 1;
    map[stamp] = cur + 1;
    localStorage.setItem(DATESEQ_KEY, JSON.stringify(map));
  } else {
    const current = Number(localStorage.getItem(SEQ_KEY) || s.invoiceNext || 1);
    localStorage.setItem(SEQ_KEY, String(current + 1));
    setSettings({ invoiceNext: current + 1 }); // keep settings in sync (optional)
  }
}

// Create & persist an invoice record (called when issuing/printing/downloading)
export function issueInvoice({ orderSnapshot, invoiceNo, issuedAtISO }) {
  const arr = loadStore();
  // avoid duplicate invoice numbers
  if (arr.some(x => x.invoiceNo === invoiceNo)) return arr.find(x => x.invoiceNo === invoiceNo);

  const s = orderSnapshot;
  const record = {
    invoiceNo,
    orderId: s.id,
    issuedAt: issuedAtISO || new Date().toISOString(),
    currency: (getSettings().currency || "MYR"),
    mode: s.mode,
    billing: s.mode === "delivery" ? (s.deliveryAddress || null) : (s.pickupOutlet || null),
    payment: s.payment || null,
    promoCode: s.promoCode || null,
    taxRate: s.taxRate || 0,
    subtotal: Number(s.subtotal || 0),
    discount: Number(s.discountTotal || s.discount || 0),
    shippingFee: Number(s.shippingFee || 0),
    total: Number(s.totalAfterDiscount ?? s.total ?? (Number(s.subtotal||0)-(Number(s.discountTotal||s.discount||0))+Number(s.shippingFee||0))),
    items: Array.isArray(s.cart) ? s.cart.map(({name,qty,price})=>({name,qty:Number(qty||1),price:Number(price||0)})) : null,
  };

  arr.push(record);
  saveStore(arr);
  return record;
}

export function listInvoices() { return loadStore().slice().sort((a,b)=> (a.issuedAt<b.issuedAt?1:-1)); }
export function deleteInvoice(invoiceNo) {
  const arr = loadStore().filter(x => x.invoiceNo !== invoiceNo);
  saveStore(arr); return true;
}

// CSV export (comma-safe)
export function invoicesToCSV(records) {
  const rows = [
    ["InvoiceNo","OrderId","IssuedAt","Mode","Subtotal","Discount","Shipping","TaxRate","Total","PaymentStatus","PaymentMethod","PromoCode"]
  ];
  for (const r of records) {
    rows.push([
      r.invoiceNo, r.orderId, r.issuedAt, r.mode,
      r.subtotal, r.discount, r.shippingFee, r.taxRate, r.total,
      r.payment?.status || "", r.payment?.method || "", r.promoCode || ""
    ]);
  }
  return rows.map(row => row.map(v=>{
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(",")).join("\n");
}
