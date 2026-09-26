import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client';

const STATUS_STYLES = {
  reported: 'bg-amber-100 text-amber-700',
  acknowledged: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-emerald-100 text-emerald-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data));
    api.get('/issues', { params: { limit: 5 } }).then((res) => setRecent(res.data.issues));
  }, []);

  if (!stats) return <p className="text-center text-gray-500 py-16">Loading dashboard…</p>;

  const statusCount = (s) => stats.byStatus.find((r) => r._id === s)?.count || 0;
  const chartData = stats.byCategory.map((r) => ({ category: r._id, count: r.count }));

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>
      <p className="text-gray-600 mt-1">Overview of every reported civic issue.</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-gray-500">Total issues</p>
        </div>
        {['reported', 'acknowledged', 'in_progress', 'resolved'].map((s) => (
          <div key={s} className="bg-white rounded-xl shadow-md p-4">
            <p className="text-3xl font-bold">{statusCount(s)}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[s]}`}>
              {s.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="font-semibold mb-4">Issues by category</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <XAxis dataKey="category" tick={{ fontSize: 13 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent issues — quick jump-off points */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="font-semibold mb-4">Latest reports</h2>
        <div className="divide-y">
          {recent.map((issue) => (
            <Link key={issue._id} to={`/issues/${issue._id}`}
              className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded">
              <div>
                <p className="font-medium text-sm">{issue.title}</p>
                <p className="text-xs text-gray-500">
                  {issue.category} · {issue.address || 'on map'} · by {issue.reportedBy?.name}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[issue.status]}`}>
                {issue.status.replace('_', ' ')}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}