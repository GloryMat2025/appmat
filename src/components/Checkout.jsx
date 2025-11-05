import React, { useState } from 'react';
import useCart from '../hooks/useCart';

export default function Checkout() {
  const { cartItems, totalPrice, removeFromCart } = useCart();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Troli anda kosong. Tambah produk dahulu!');
      return;
    }

    const order = {
      name: form.name,
      phone: form.phone,
      address: form.address,
      items: cartItems,
      total: totalPrice,
    };

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      if (!res.ok) throw new Error('Server error');
      alert('✅ Order sent successfully!');

      // Send a follow-up notification to the server (used for push/notification UI)
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'AppMat Update',
            body: '✅ Pesanan anda telah berjaya disinkronkan!',
            url: '/orders',
          }),
        });
      } catch (notifyErr) {
        // Non-fatal — log and continue
        console.warn('Notify failed', notifyErr);
      }
    } catch (err) {
      alert('⚠️ Offline mode: Order will be sent automatically later.');
      // Ask SW to sync later
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register('sync-orders');
        console.log('📡 Sync registered for later.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="checkout" className="py-12 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-yellow-400">Checkout</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nama</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Telefon</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="mt-1 block w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Alamat</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              className="mt-1 block w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold">Ringkasan Pesanan</h3>
            <ul className="mt-2 space-y-2">
              {cartItems.map((it) => (
                <li key={it.id} className="flex justify-between">
                  <span>
                    {it.title} x {it.quantity}
                  </span>
                  <span>RM {(it.price * it.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="text-right mt-4">
              <strong>Jumlah: RM {totalPrice.toFixed(2)}</strong>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {submitting ? 'Memproses...' : 'Hantar Pesanan'}
            </button>
            <button
              type="button"
              onClick={() => removeFromCart(null)}
              className="text-sm text-red-600"
            >
              Kosongkan Troli
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
