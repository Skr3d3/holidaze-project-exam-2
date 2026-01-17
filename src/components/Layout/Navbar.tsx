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
    "block px-3 py-2 rounded-md text-sm font-medium " +
    (isActive ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white");

  return (
    <header className="bg-gray-800 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-white font-semibold">Holidaze</Link>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/venues" className={linkCls}>Venues</NavLink>
              {loggedIn && <NavLink to="/profile" className={linkCls}>Profile</NavLink>}
              {user?.venueManager && <NavLink to="/managevenues" className={linkCls}>Manage</NavLink>}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {!loggedIn ? (
              <>
                <Link to="/login" className="btn">Login</Link>
                <Link to="/register" className="btn-secondary">Sign up</Link>
              </>
            ) : (
              <>
                <span className="text-gray-200 text-sm">Hi, {user?.name}</span>
                <button className="btn-danger" onClick={logout}>Logout</button>
              </>
            )}
          </div>

          <button
            aria-label="Open menu"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-200 hover:bg-gray-700"
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
        <div className="md:hidden border-t border-gray-700 bg-gray-800">
          <nav className="px-2 pt-2 pb-3 space-y-1">
            <NavLink to="/venues" className={linkCls}>Venues</NavLink>
            {loggedIn && <NavLink to="/profile" className={linkCls}>Profile</NavLink>}
            {user?.venueManager && <NavLink to="/managevenues" className={linkCls}>Manage</NavLink>}

            {!loggedIn ? (
              <div className="mt-2 flex flex-col gap-2">
                <Link to="/login" className="btn w-full text-center">Login</Link>
                <Link to="/register" className="btn-secondary w-full text-center">Sign up</Link>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <button className="btn-danger w-full" onClick={logout}>Logout</button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}