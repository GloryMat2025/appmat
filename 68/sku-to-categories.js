
export async function deriveCategoriesFromSkus(items){
  const map = await fetch('/config/sku-categories.json', { cache:'no-store' })
    .then(r=>r.json()).then(j=>j.map||{}).catch(()=>({}));
  const set = new Set();
  (items||[]).forEach(it => {
    const sku = String((it && it.sku) || '').trim();
    if (!sku) return;
    const cat = map[sku];
    if (cat) set.add(String(cat));
  });
  return Array.from(set);
}
