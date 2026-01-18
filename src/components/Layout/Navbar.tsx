import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "../../lib/auth";

type UserShape = { name: string; venueManager?: boolean } | null;

export default function Navbar() {
  const nav = useNavigate();
  const loc = useLocation();
  const [user, setUser] = useState<UserShape>(getUser<UserShape>());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onAuth = () => setUser(getUser<UserShape>());
    window.addEventListener("authchange", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("authchange", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  const loggedIn = !!user?.name;

  function logout() {
    clearAuth();
    setUser(null);
    setOpen(false);
    nav("/login");
  }

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    "block px-3 py-2 rounded-md text-sm font-medium transition-colors " +
    (isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white");

  return (
    <header className="bg-gray-900 sticky top-0 z-40 border-b border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-white text-xl font-semibold tracking-tight">Holidaze</Link>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/venues" className={linkCls}>Venues</NavLink>
              {loggedIn && <NavLink to="/profile" className={linkCls}>Profile</NavLink>}
              {user?.venueManager && <NavLink to="/managevenues" className={linkCls}>Manage</NavLink>}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!loggedIn ? (
              <>
                <Link to="/login" className="btn bg-gray-800 hover:bg-gray-700 border-gray-700">Login</Link>
                <Link to="/register" className="btn bg-white text-gray-900 hover:bg-gray-100 border-transparent">Sign up</Link>
              </>
            ) : (
              <>
                <span className="text-gray-300 text-sm">Hi, {user?.name}</span>
                <button className="btn-danger py-1.5 px-3 text-xs" onClick={logout}>Logout</button>
              </>
            )}
          </div>

          <button
            aria-label="Open menu"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-200 hover:bg-gray-800"
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              {open ? (
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900">
          <nav className="px-2 pt-2 pb-3 space-y-1">
            <NavLink to="/venues" className={linkCls}>Venues</NavLink>
            {loggedIn && <NavLink to="/profile" className={linkCls}>Profile</NavLink>}
            {user?.venueManager && <NavLink to="/managevenues" className={linkCls}>Manage</NavLink>}

            {!loggedIn ? (
              <div className="mt-4 flex flex-col gap-2 px-1">
                <Link to="/login" className="btn bg-gray-800 hover:bg-gray-700 border-gray-700 w-full justify-center">Login</Link>
                <Link to="/register" className="btn bg-white text-gray-900 hover:bg-gray-100 border-transparent w-full justify-center">Sign up</Link>
              </div>
            ) : (
              <div className="mt-4 px-1">
                 <div className="text-gray-400 text-sm mb-2 px-2">Signed in as {user?.name}</div>
                <button className="btn-danger w-full justify-center" onClick={logout}>Logout</button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
