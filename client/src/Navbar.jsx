import React from 'react';

function Navbar() {
  const goBack = () => window.history.back();

  const goHome = () => {
    // simple “home”: reload current app state
    location.reload();
  };

  return (
    <div className="w-full flex items-center justify-between bg-gray-100 px-4 py-2 shadow">
      <div className="flex gap-2">
        <button onClick={goBack} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">
          Back
        </button>
        <button onClick={goHome} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">
          Home
        </button>
      </div>
      <h1 className="text-lg font-semibold">Club Booking</h1>
    </div>
  );
}

export default Navbar;
