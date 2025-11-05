import React, { useEffect, useState } from 'react';
import '../styles/offline.css';

export default function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Auto-retry every few seconds
  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 1 ? prev - 1 : 5));
      if (navigator.onLine) {
        setIsOffline(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isOffline]);

  const tryReconnect = () => {
    if (navigator.onLine) {
      setIsOffline(false);
    } else {
      setSeconds(5);
      setTimeout(() => {
        if (navigator.onLine) setIsOffline(false);
      }, 1000);
    }
  };

  if (!isOffline) return null;

  return (
    <div className="offline-banner">
      <p>⚠️ You’re offline — checking again in {seconds}s...</p>
      <button className="retry-btn" onClick={tryReconnect}>
        Try Reconnect
      </button>
    </div>
  );
}
