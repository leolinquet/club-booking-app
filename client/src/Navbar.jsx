import React, { useEffect, useRef, useState } from "react";

export default function Navbar(props) {
  const {
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
  } = props;

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("click", onClick, { capture: true });
    return () => window.removeEventListener("click", onClick, { capture: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handle = (fn) => () => { setOpen(false); fn(); };

  const navBtn = "px-3 py-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10";
  const menuItem = "w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10";

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 h-14">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between w-full">
        <div className="flex items-center h-full">
          <button onClick={onBook} aria-label="Go to booking" className="text-lg font-semibold px-1 h-full flex items-center">
            Club Booking
          </button>
        </div>

        <nav className="hidden sm:flex items-center gap-2">
          <button aria-label="Open announcements" onClick={onOpenAnnouncements} className={`relative ${navBtn}`} title="Announcements">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 17H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 22C13.1046 22 14 21.1046 14 20H10C10 21.1046 10.8954 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 8C18 5.79086 15.866 4 13.5 4C11.134 4 9 5.79086 9 8V11C9 12.0609 8.57857 13.0783 7.82843 13.8284L7 14.6569V16H18V14.6569L17.1716 13.8284C16.4214 13.0783 16 12.0609 16 11V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium leading-none text-white bg-red-600 rounded-full">{unreadCount}</span>
            ) : null}
          </button>

          <button onClick={onBook} className={navBtn}>Book</button>
          {isManager ? <button onClick={onHome} className={navBtn}>Home</button> : null}
          <button onClick={onClubs} className={navBtn}>Clubs</button>
          <button onClick={onTournaments} className={navBtn}>Tournaments</button>
          <button onClick={onRankings} className={navBtn}>Rankings</button>

          {user ? <span className="ml-2 text-sm opacity-75">Hi, {user.display_name ?? user.name ?? 'you'}</span> : null}
        </nav>

        <div className="sm:hidden ml-auto flex items-end pr-2 pb-2 h-full">
          <button aria-label="Toggle menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(v => !v)} className="h-9 w-9 flex flex-col justify-center items-center space-y-1 py-1.5">
            {/* stacked bars using space-y for consistent spacing */}
            <span className={`block h-[2px] w-5 bg-black transition-all duration-200 ${open ? 'rotate-45 translate-y-0' : ''}`} />
            <span className={`block h-[2px] w-5 bg-black transition-all duration-200 ${open ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block h-[2px] w-5 bg-black transition-all duration-200 ${open ? '-rotate-45 translate-y-0' : ''}`} />
          </button>
        </div>
      </div>

      <div className={open ? 'sm:hidden fixed inset-0 bg-black/40 opacity-100 pointer-events-auto z-40 transition-opacity duration-200' : 'sm:hidden fixed inset-0 bg-black/40 opacity-0 pointer-events-none z-0 transition-opacity duration-200'} />

      <div id="mobile-menu" ref={menuRef} role="dialog" aria-modal="true" className={open ? 'sm:hidden fixed left-0 right-0 top-14 px-3 z-50 pointer-events-auto transition-all duration-200' : 'sm:hidden fixed left-0 right-0 top-14 px-3 z-0 pointer-events-none transition-all duration-200'}>
        <div className={open ? 'rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden origin-top scale-y-100 opacity-100 transition duration-200' : 'rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden origin-top scale-y-95 opacity-0 pointer-events-none transition duration-200'} style={{ transformOrigin: 'top center' }}>
          <div className="p-1 flex flex-col">
            <button onClick={() => { setOpen(false); onOpenAnnouncements(); }} className={menuItem}>Announcements</button>
            <button onClick={handle(onBook)} className={menuItem}>Book</button>
            {isManager ? <button onClick={handle(onHome)} className={menuItem}>Home</button> : null}
            <button onClick={handle(onClubs)} className={menuItem}>Clubs</button>
            <button onClick={handle(onTournaments)} className={menuItem}>Tournaments</button>
            <button onClick={handle(onRankings)} className={menuItem}>Rankings</button>
            {user ? <button onClick={handle(onLogout)} className={`${menuItem} text-red-600 flex items-center justify-center`}>Log out</button> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
