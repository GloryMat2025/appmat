export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-semibold">AppMat</h1>
      <div className="space-x-4">
        <a href="#" className="hover:underline">
          Home
        </a>
        <a href="#" className="hover:underline">
          Menu
        </a>
        <a href="#" className="hover:underline">
          Contact
        </a>
      </div>
    </nav>
  );
}
