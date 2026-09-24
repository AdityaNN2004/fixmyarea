import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6">Welcome back</h1>

      {error && <p className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="email" type="email" value={form.email} onChange={handleChange}
          placeholder="Email" required
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <input name="password" type="password" value={form.password} onChange={handleChange}
          placeholder="Password" required
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <button disabled={submitting}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        New here? <Link to="/register" className="text-emerald-600 font-medium">Create an account</Link>
      </p>
    </div>
  );
}