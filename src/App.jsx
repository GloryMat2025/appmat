import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import React from "react";
import OfflineStatus from "./components/OfflineStatus";

function App() {
  return (
    <>
      <header>
        <h1>AppMat</h1>
      </header>

      <main>
        <p>Your app content goes here...</p>
      </main>

      {/* ✅ Offline detector */}
      <OfflineStatus />
    </>
  );
}

export default App;
