import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const base =
    "text-sm px-2 py-1 text-gray-700 hover:text-gray-900 transition";
  const active = "text-sm px-2 py-1 text-gray-900 font-semibold";

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="text-lg font-semibold text-gray-900">
          Holidaze
        </Link>

        <div className="flex gap-2">
          <NavLink to="/" className={({ isActive }) => (isActive ? active : base)}>
            Home
          </NavLink>
          <NavLink
            to="/venues"
            className={({ isActive }) => (isActive ? active : base)}
          >
            Venues
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? active : base)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/manage/venues"
            className={({ isActive }) => (isActive ? active : base)}
          >
            Manage
          </NavLink>
        </div>

        <div className="flex gap-2">
          <Link to="/login" className="text-sm text-gray-700 hover:text-gray-900">
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm bg-gray-900 text-white rounded-xl px-3 py-1 hover:opacity-90"
          >
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
}
