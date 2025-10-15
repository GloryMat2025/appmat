
export function setCartCategories(categories){
  const set = new Set((categories||[]).map(String));
  localStorage.setItem('cartCategories', JSON.stringify(Array.from(set)));
  window.dispatchEvent(new CustomEvent('cart:categories', { detail: Array.from(set) }));
  return Array.from(set);
}
export function getCartCategories(){
  try { return JSON.parse(localStorage.getItem('cartCategories')||'[]'); } catch { return []; }
}
export function addCartCategory(cat){
  const arr = new Set(getCartCategories()); arr.add(String(cat));
  return setCartCategories(Array.from(arr));
}
export function clearCartCategories(){
  localStorage.removeItem('cartCategories');
  window.dispatchEvent(new CustomEvent('cart:categories', { detail: [] }));
}
