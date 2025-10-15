// src/utils/csv.js
export function toCSV(rows, headers) {
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const head = headers || Object.keys(rows[0] || {});
  const lines = [head.join(",")];
  rows.forEach(r => lines.push(head.map(h => escape(r[h])).join(",")));
  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
}
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
