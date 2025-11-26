import { motion } from 'framer-motion';

Hero.propTypes = {
  // TODO: define props here (auto added)
};

export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-6 text-center relative overflow-hidden">
      {/* Animasi latar belakang */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.25, scale: 1 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'mirror' }}
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center blur-sm opacity-30"
      ></motion.div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl font-bold mb-4"
        >
          Selamat Datang ke <span className="text-yellow-300">AppMat</span>
        </motion.h1>

        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-lg text-blue-100 mb-6"
        >
          Nikmati pengalaman membeli yang pantas, mudah dan bergaya.
        </motion.p>

        <motion.a
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          href="#menu"
          className="bg-yellow-400 text-blue-900 font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-yellow-300 transition"
        >
          Mula Sekarang
        </motion.a>
      </div>
    </section>
  );
}
