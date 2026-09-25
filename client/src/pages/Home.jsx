import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const STATUS_STYLES = {
  reported: 'bg-amber-100 text-amber-700',
  acknowledged: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-emerald-100 text-emerald-700',
};
const CATEGORY_ICONS = {
  pothole: '🕳️', garbage: '🗑️', streetlight: '💡', water: '💧', traffic: '🚦', other: '📍',
};
const CATEGORIES = Object.keys(CATEGORY_ICONS);
const STATUSES = Object.keys(STATUS_STYLES);

export default function Home() {
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  // Results of the last completed fetch, tagged with the exact request it answers
  const [cache, setCache] = useState({ key: '', issues: [], pages: 1, failed: false });

  // The current request, as one comparable string
  const requestKey = `${status}|${category}|${page}`;

  useEffect(() => {
    // Already holding data for exactly this request? Nothing to fetch.
    if (cache.key === requestKey) return;

    // Race guard: if the user changes filters while a request is in flight,
    // the cleanup for the outdated run sets ignore=true and its late
    // response gets discarded instead of clobbering fresh results
    let ignore = false;

    const params = { page };
    if (status) params.status = status;
    if (category) params.category = category;

    api.get('/issues', { params })
      .then((res) => {
        if (!ignore) setCache({ key: requestKey, issues: res.data.issues, pages: res.data.pages, failed: false });
      })
      .catch(() => {
        if (!ignore) setCache({ key: requestKey, issues: [], pages: 1, failed: true });
      });

    return () => { ignore = true; };
  }, [requestKey, cache.key, status, category, page]);

  // DERIVED, not stored: loading = "what we hold ≠ what we asked for"
  const loading = cache.key !== requestKey;

  const selectCls = 'border rounded-lg px-3 py-2 text-sm bg-white';

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8">
      <h1 className="text-3xl font-bold">Reported issues</h1>
      <p className="text-gray-600 mt-1">Every problem pinned, photographed, and tracked.</p>

      <div className="flex gap-3 mt-4 mb-6">
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-16">Loading issues…</p>
      ) : cache.failed ? (
        <p className="text-center text-red-500 py-16">Couldn't load issues. Is the server running?</p>
      ) : cache.issues.length === 0 ? (
        <p className="text-center text-gray-500 py-16">No issues found. Be the first to report one!</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cache.issues.map((issue) => (
            <Link key={issue._id} to={`/issues/${issue._id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow block">
              <img src={issue.photoUrl} alt={issue.title} className="h-40 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{CATEGORY_ICONS[issue.category]} {issue.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[issue.status]}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="font-semibold leading-snug">{issue.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {issue.address || 'Pinned on map'} · {new Date(issue.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 mt-2">by {issue.reportedBy?.name || 'Anonymous'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {cache.pages > 1 && (
        <div className="flex justify-center items-center gap-4 my-8">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            className="border px-3 py-1 rounded-lg disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-600">Page {page} of {cache.pages}</span>
          <button disabled={page === cache.pages} onClick={() => setPage(page + 1)}
            className="border px-3 py-1 rounded-lg disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}