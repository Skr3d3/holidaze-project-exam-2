import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold mb-2">404 – Not Found</h1>
      <p className="text-gray-600 mb-6">
        The page you’re looking for doesn’t exist.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-1 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm"
      >
        Go home
      </Link>
    </div>
  );
}