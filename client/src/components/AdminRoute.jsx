import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-8 text-center">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;

  // Not "who are you?" (401) but "I know you — and no" (403). Live demo of the distinction.
  if (user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-24 text-center">
        <h1 className="text-2xl font-bold">403 — Admins only</h1>
        <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
        <Link to="/" className="text-emerald-600 mt-4 inline-block">← Back to feed</Link>
      </div>
    );
  }

  return <Outlet />;
}