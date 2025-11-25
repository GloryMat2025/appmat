import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../App.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Admin from './pages/Admin.jsx';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import './styles/main.css';
import './styles/offline.css';
import './scripts/registerSW';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => console.log('✅ Service Worker didaftarkan'))
    .catch((err) => console.error('❌ SW gagal:', err));
}

useEffect(() => {
  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') console.log('🔔 Notifikasi dibenarkan!');
    });
  }
}, []);
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </ThemeProvider>
  </React.StrictMode>
);
