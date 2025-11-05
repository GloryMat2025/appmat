import Card from '../components/Card';

export default function Home() {
  return (
    <div className="bg-white dark:bg-gray-800 dark:text-gray-100 shadow-md rounded-lg p-4 hover:shadow-lg transition">
      <section id="menu" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <Card title="Produk 1" desc="Deskripsi produk pertama" />
        <Card title="Produk 2" desc="Deskripsi produk kedua" />
        <Card title="Produk 3" desc="Deskripsi produk ketiga" />
      </section>
    </div>
  );
}
