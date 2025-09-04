import React, { useEffect, useRef, useState } from "react";

export default function Navbar({
  onBook, onHome, onClubs, onTournaments, onRankings, isManager
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("click", onClick, { capture: true });
    return () => window.removeEventListener("click", onClick, { capture: true });
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const handle = (fn) => () => { setOpen(false); fn(); };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onBook}
          className="text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black/20 rounded px-1"
          aria-label="Go to booking"
        >
          Club Booking
        </button>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <button onClick={onBook} className="nav-btn">Book</button>
          {isManager && <button onClick={onHome} className="nav-btn">Home</button>}
          <button onClick={onClubs} className="nav-btn">Clubs</button>
          <button onClick={onTournaments} className="nav-btn">Tournaments</button>
          <button onClick={onRankings} className="nav-btn">Rankings</button>
        </nav>

        {/* Mobile hamburger */}
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden relative h-9 w-9 grid place-items-center group"
        >
          {/* animated burger → X */}
          <span
            className={`burger-line translate-y-[-6px] ${open ? "rotate-45 translate-y-0" : ""}`}
          />
          <span className={`burger-line ${open ? "opacity-0 scale-x-0" : ""}`} />
          <span
            className={`burger-line translate-y-[6px] ${open ? "-rotate-45 translate-y-0" : ""}`}
          />
        </button>
      </div>

      {/* Backdrop */}
      <div
        className={`sm:hidden fixed inset-0 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Mobile dropdown (animated) */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        className="sm:hidden fixed left-0 right-0 top-14 z-50 px-3"
      >
        <div
          className={`rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden
                      origin-top transition duration-200 will-change-transform
                      ${open ? "scale-y-100 opacity-100" : "scale-y-95 opacity-0 pointer-events-none"}`}
          style={{ transformOrigin: "top center" }}
        >
          <div className="p-1 flex flex-col">
            <button onClick={handle(onBook)} className="menu-item">Book</button>
            {isManager && <button onClick={handle(onHome)} className="menu-item">Home</button>}
            <button onClick={handle(onClubs)} className="menu-item">Clubs</button>
            <button onClick={handle(onTournaments)} className="menu-item">Tournaments</button>
            <button onClick={handle(onRankings)} className="menu-item">Rankings</button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* --- tiny inline style helpers via Tailwind classes ---
   You already use Tailwind-y classes in the app.
   If you want these in a CSS file instead, see the note below.
*/

/* Suggested Tailwind component classes (put in your global CSS if you prefer):
.nav-btn    = "px-3 py-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10"
.menu-item  = "w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10"
.burger-line= "pointer-events-none absolute block h-[2px] w-5 bg-black transition-all duration-200 ease-in-out"
*/
