import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Home from './pages/Home';
import Footer from './components/Footer';
import OfflineStatus from './components/OfflineStatus';

export default function App() {
  return (
    <>
      <Navbar />

      <header>
        <h1>AppMat</h1>
      </header>

      <main>
        <Hero />
        <Home />
      </main>

      <Footer />
      <OfflineStatus />
    </>
  );
}
