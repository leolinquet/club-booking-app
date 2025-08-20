function Navbar() {
  const goBack = () => window.history.back(); 

  return (
    <div className="w-full flex items-center justify-between bg-gray-100 px-4 py-2 shadow">
      <button
        onClick={goBack}
        className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
      >
        Back
      </button>
      <h1 className="text-lg font-semibold">Club Booking</h1>
    </div>
  );
}

export default Navbar;
