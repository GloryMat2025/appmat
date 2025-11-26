import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import Home from './pages/Home';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white">
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />
      <Home />
      <Footer />
    </div>
  );
}
