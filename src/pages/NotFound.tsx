import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="page-heading">404 – Not Found</h1>
      <p className="text-gray-500 mb-6">
        The page you’re looking for doesn’t exist.
      </p>
      <Link
        to="/"
        className="btn gap-1"
      >
        Go home
      </Link>
    </div>
  );
}
