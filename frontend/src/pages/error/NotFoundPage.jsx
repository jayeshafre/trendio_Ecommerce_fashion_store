import { Link } from "react-router-dom";
export default function NotFoundPage() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
      <h1 className="font-display text-6xl font-bold text-brand-500">404</h1>
      <p className="text-gray-500">Page not found.</p>
      <Link to="/" className="btn-primary">Go Home</Link>
    </div>
  );
}
