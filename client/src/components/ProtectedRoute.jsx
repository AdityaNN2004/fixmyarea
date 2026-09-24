import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext'; 
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  // Wait for the /me check before deciding — otherwise every refresh
  // briefly kicks a logged-in user to /login
  if (loading) return <p className="p-8 text-center">Loading…</p>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}