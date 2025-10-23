import React, { useEffect, useRef, useState } from "react";

export default function Navbar({
  onBook = () => {},
  onOpenConversations = () => {},
  onOpenAnnouncements = () => {},
  onOpenFeedback = () => {},
  onFeedbackAdmin = () => {},
  onHome = () => {},
  onClubs = () => {},
  onTournaments = () => {},
  onRankings = () => {},
  onLogout = () => {},
  onOpenLooking = () => {},
  lookingCount = 0,
  unreadCount = 0,
  unreadMessageCount = 0,
  isManager = false,
  user = null,
}) {
  // debug: surface props in browser console to verify HMR and prop passing
  try { console.debug('Navbar props -> onOpenLooking?', !!onOpenLooking, 'lookingCount', lookingCount); } catch (e) {}
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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between relative">
        {/* Brand */}
        <button
          onClick={onBook}
          className="text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black/20 rounded px-1"
          aria-label="Go to booking"
        >
          SportsClubNet
        </button>

        {/* Mobile quick access removed — Looking is only available from hamburger menu */}

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <div className="relative">
            <button onClick={onOpenConversations} className={navBtn}>💬</button>
            {unreadMessageCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-red-600 text-white rounded-full">
                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
              </span>
            )}
          </div>
          <div className="relative">
            <button onClick={onOpenAnnouncements} className={navBtn}>Announcements</button>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-red-600 text-white rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {/* Desktop Looking (visible on sm and up). For mobile, Looking stays inside the hamburger menu. */}
          <div className="hidden sm:block relative">
            <button onClick={onOpenLooking} className={navBtn}>Looking</button>
            {lookingCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-red-600 text-white rounded-full">{lookingCount > 9 ? '9+' : lookingCount}</span>
            )}
          </div>
          <button onClick={onBook} className={navBtn}>Book</button>
          {isManager && <button onClick={onHome} className={navBtn}>Home</button>}
          <button onClick={onClubs} className={navBtn}>Clubs</button>
          <button onClick={onTournaments} className={navBtn}>Tournaments</button>
          <button onClick={onRankings} className={navBtn}>Rankings</button>
          <button onClick={onOpenFeedback} className={navBtn}>Feedback</button>
          {isManager && <button onClick={onFeedbackAdmin} className={navBtn}>Feedback Admin</button>}

          {user ? (
            <>
              <span className="ml-2 text-sm opacity-75">
                Hi, {user.display_name ?? user.name ?? "you"}
              </span>
              <button
                onClick={onLogout}
                className="ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 flex items-center gap-1"
                title="Logout"
              >
                <svg className="w-3 h-3" viewBox="0 0 512 512" fill="currentColor">
                  <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
                </svg>
                Logout
              </button>
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
      </div>      {/* Backdrop - only mount when open */}
      {open && (
        <div className="sm:hidden fixed inset-0 bg-black/40 transition-opacity duration-200 opacity-100 pointer-events-auto z-40" />
      )}

      {/* Mobile dropdown - only mount when open */}
      {open && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          className="sm:hidden fixed left-0 right-0 z-50 px-3"
          style={{ top: '56px' }} // Fixed positioning for mobile
        >
          <div
            className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden
                        origin-top transition duration-200 will-change-transform
                        scale-y-100 opacity-100"
            style={{ transformOrigin: "top center" }}
          >
              <div className="p-1 flex flex-col">
              <button onClick={handle(onOpenConversations)} className={menuItem}>
                <div className="flex items-center justify-between">
                  <span>💬 Conversations</span>
                  {unreadMessageCount > 0 && (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs bg-red-600 text-white rounded-full">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </div>
              </button>
              <button onClick={handle(onOpenAnnouncements)} className={menuItem}>
                <div className="flex items-center justify-between">
                  <span>Announcements</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs bg-red-600 text-white rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </button>
              <button onClick={handle(onOpenLooking)} className={menuItem}>
                <div className="flex items-center justify-between">
                  <span>Looking</span>
                  {lookingCount > 0 && (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs bg-red-600 text-white rounded-full">{lookingCount > 9 ? '9+' : lookingCount}</span>
                  )}
                </div>
              </button>
              <button onClick={handle(onBook)} className={menuItem}>Book</button>
              {isManager && <button onClick={handle(onHome)} className={menuItem}>Home</button>}
              <button onClick={handle(onClubs)} className={menuItem}>Clubs</button>
              <button onClick={handle(onTournaments)} className={menuItem}>Tournaments</button>
              <button onClick={handle(onRankings)} className={menuItem}>Rankings</button>
              <button onClick={handle(onOpenFeedback)} className={menuItem}>📝 Give Feedback</button>
              {isManager && <button onClick={handle(onFeedbackAdmin)} className={menuItem}>🛠️ Feedback Admin</button>}

              {/* Mobile logout button - only show if user is logged in */}
              {user && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-3 py-2 text-sm text-gray-600">
                    Hi, {user.display_name ?? user.name ?? "you"}
                  </div>
                  <button 
                    onClick={handle(onLogout)} 
                    className={`${menuItem} text-red-600 hover:bg-red-50 flex items-center gap-2`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
                    </svg>
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
