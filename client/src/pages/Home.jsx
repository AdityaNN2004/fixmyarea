import { useAuth } from '../context/authContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="max-w-3xl mx-auto mt-16 text-center">
      <h1 className="text-4xl font-bold">FixMyArea</h1>
      <p className="mt-3 text-gray-600">Report local civic issues. Track them getting fixed.</p>
      {user && <p className="mt-6 text-emerald-600 font-medium">Logged in as {user.name} ({user.role})</p>}
    </div>
  );
}