export async function getOrderById(id) {
  const res = await fetch('/assets/data/orders.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load orders.json');
  const list = await res.json();
  return list.find(o => o.id === id) || null;
}

export const fmtMY = (n) =>
  new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 2 }).format(n);
