/* eslint-disable no-undef, no-unused-vars */
const handleSubmit = async (e) => {
  e.preventDefault();

  const order = {
    name: form.name,
    phone: form.phone,
    address: form.address,
    items: cartItems,
    total: totalPrice,
  };

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
  }
};
