import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Home from './pages/Home';
import Footer from './components/Footer';
import OfflineStatus from './components/OfflineStatus';
import React from 'react';
import OfflineStatus from './components/OfflineStatus';

function App() {
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

      {/* ✅ Offline detector */}
      <OfflineStatus />
    </>
  );
}

export default App;
