import React, { useEffect, useRef, useState } from "react";

export default function Navbar({
  onBook = () => {},
  onHome = () => {},
  onClubs = () => {},
  onTournaments = () => {},
  onRankings = () => {},
  onLogout = () => {},
  isManager = false,
  user = null,
  onOpenAnnouncements = () => {},
  unreadCount = 0,
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
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handle = (fn) => () => { setOpen(false); fn(); };

  const navBtn =
    "px-3 py-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10";
  const menuItem =
    "w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10";

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
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
          {/* Notifications */}
          <button
            aria-label="Open announcements"
            onClick={onOpenAnnouncements}
            className={`relative ${navBtn}`}
            title="Announcements"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 17H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 22C13.1046 22 14 21.1046 14 20H10C10 21.1046 10.8954 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 8C18 5.79086 15.866 4 13.5 4C11.134 4 9 5.79086 9 8V11C9 12.0609 8.57857 13.0783 7.82843 13.8284L7 14.6569V16H18V14.6569L17.1716 13.8284C16.4214 13.0783 16 12.0609 16 11V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium leading-none text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <button onClick={onBook} className={navBtn}>Book</button>
          {isManager && <button onClick={onHome} className={navBtn}>Home</button>}
          <button onClick={onClubs} className={navBtn}>Clubs</button>
          <button onClick={onTournaments} className={navBtn}>Tournaments</button>
          <button onClick={onRankings} className={navBtn}>Rankings</button>

          {user ? (
            <>
              <span className="ml-2 text-sm opacity-75">
                Hi, {user.display_name ?? user.name ?? "you"}
              </span>
            </>
          ) : null}
        </nav>

        {/* Mobile hamburger */}
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden relative h-9 w-9 grid place-items-center"
        >
          {/* three bars that animate into an X */}
          <span
            className={`pointer-events-none absolute block h-[2px] w-5 bg-black transition-all duration-200 ease-in-out ${
              open ? "rotate-45" : "-translate-y-[6px]"
            }`}
          />
          <span
            className={`pointer-events-none absolute block h-[2px] w-5 bg-black transition-all duration-200 ease-in-out ${
              open ? "opacity-0 scale-x-0" : ""
            }`}
          />
          <span
            className={`pointer-events-none absolute block h-[2px] w-5 bg-black transition-all duration-200 ease-in-out ${
              open ? "-rotate-45" : "translate-y-[6px]"
            }`}
          />
        </button>
      </div>

      {/* Backdrop */}
      <div
        className={`sm:hidden fixed inset-0 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto z-40" : "opacity-0 pointer-events-none z-0"
        }`}
      />

      {/* Mobile dropdown */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        className={`sm:hidden fixed left-0 right-0 top-14 px-3 transition-all duration-200 ${
          open ? "z-50 pointer-events-auto" : "z-0 pointer-events-none"
        }`}
      >
        <div
          className={`rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden
                      origin-top transition duration-200 will-change-transform
                      ${open ? "scale-y-100 opacity-100" : "scale-y-95 opacity-0 pointer-events-none"}`}
          style={{ transformOrigin: "top center" }}
        >
          <div className="p-1 flex flex-col">
            {/* Notifications (mobile) */}
            <button onClick={() => { setOpen(false); onOpenAnnouncements(); }} className={menuItem}>
              Announcements
            </button>

            <button onClick={handle(onBook)} className={menuItem}>Book</button>
            {isManager && <button onClick={handle(onHome)} className={menuItem}>Home</button>}
            <button onClick={handle(onClubs)} className={menuItem}>Clubs</button>
            <button onClick={handle(onTournaments)} className={menuItem}>Tournaments</button>
            <button onClick={handle(onRankings)} className={menuItem}>Rankings</button>

            {/* PWA Install (mobile) removed */}

            {user ? (
              <button onClick={handle(onLogout)} className={`${menuItem} text-red-600 flex items-center justify-center`}>
                Log out
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
