// src/components/Layout/Navbar.tsx
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "../../lib/auth";

export default function Navbar() {
  const nav = useNavigate();
  const [userName, setUserName] = useState<string | null>(getUser<{ name: string }>()?.name ?? null);

  useEffect(() => {
    const onAuth = () => setUserName(getUser<{ name: string }>()?.name ?? null);
    window.addEventListener("authchange", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("authchange", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  const loggedIn = !!userName;

  function logout() {
    clearAuth();
    setUserName(null);
    nav("/login");
  }

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    "px-3 py-2 rounded-md text-sm font-medium " +
    (isActive ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white");

  return (
    <header className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-white font-semibold">Holidaze</Link>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/venues" className={linkCls}>Venues</NavLink>
              {loggedIn && <NavLink to="/profile" className={linkCls}>Profile</NavLink>}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {!loggedIn ? (
              <>
                <Link to="/login" className="btn">Login</Link>
                <Link to="/register" className="btn-secondary">Sign up</Link>
              </>
            ) : (
              <>
                <span className="hidden sm:block text-gray-200 text-sm">Hi, {userName}</span>
                <button className="btn-danger" onClick={logout}>Logout</button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
