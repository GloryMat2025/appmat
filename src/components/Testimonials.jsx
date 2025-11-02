export default function Testimonials() {
  const people = [
    { name: "Ali", msg: "AppMat memang memudahkan urusan saya!" },
    { name: "Siti", msg: "Reka bentuk cantik, respons cepat." },
    { name: "Rahman", msg: "Saya suka dark mode dia 😄" },
  ];

  return (
    <section id="testimonials" className="py-20 bg-blue-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 data-aos="fade-up" className="text-3xl font-bold mb-8">
          Apa Kata Pengguna
        </h2>

        <div className="grid sm:grid-cols-3 gap-6">
          {people.map((p, i) => (
            <div
              key={i}
              data-aos="flip-left"
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
            >
              <p className="italic mb-3">“{p.msg}”</p>
              <h4 className="font-semibold text-blue-700 dark:text-yellow-400">
                — {p.name}
              </h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
