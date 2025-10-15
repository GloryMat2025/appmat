export async function webShare({ title, text, url }) {
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return true; }
    catch { /* dismissed */ return false; }
  }
  // Fallback: copy to clipboard
  try { await navigator.clipboard.writeText(url || text || ""); alert("Link copied!"); }
  catch { prompt("Copy this link:", url || text || ""); }
  return false;
}
