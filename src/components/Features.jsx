export default function Features() {
  const data = [
    { title: 'Cepat & Mudah', desc: 'Tempahan pantas hanya beberapa klik.' },
    { title: 'Reka Bentuk Moden', desc: 'Antaramuka mesra pengguna dan bergaya.' },
    { title: 'Sokongan 24/7', desc: 'Kami sedia membantu bila-bila masa.' },
  ];

  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 data-aos="fade-up" className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
          Ciri Utama Kami
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {data.map((f, i) => (
            <div
              key={i}
              data-aos="zoom-in-up"
              className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
