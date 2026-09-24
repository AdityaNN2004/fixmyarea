import { Link } from 'react-router-dom';
import { useAuth } from '../context/authContext'; 
export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-emerald-700">🛠️ FixMyArea</Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-600">Hi, {user.name}</span>
              <button onClick={logout}
                className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm hover:text-emerald-600">Log in</Link>
              <Link to="/register"
                className="text-sm bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}