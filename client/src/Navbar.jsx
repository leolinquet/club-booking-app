import React from "react";

function Navbar({ onBook, onHome, onClubs, onTournaments, onRankings, isManager }) {
  return (
    <div className="w-full flex items-center justify-between bg-gray-100 px-4 py-2 shadow">
      <div className="flex gap-2">
        {/* Back arrow only on the club join/create page */}
        {window.location.pathname === '/clubs/join' && (
          <button
            onClick={() => { window.location.href = '/'; }}
            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
            title="Back to sign-in"
          >
            ←
          </button>
        )}

        <button onClick={onBook} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">
          Book
        </button>

        {isManager && (
          <button onClick={onHome} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">
            Home
          </button>
        )}

        <button onClick={onClubs} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">
          Clubs
        </button>

        <button onClick={onTournaments} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">
          Tournaments
        </button>

        <button onClick={onRankings} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">
          Rankings
        </button>
      </div>

      <h1 className="text-lg font-semibold">Club Booking</h1>
    </div>
  );
}

export default Navbar;
