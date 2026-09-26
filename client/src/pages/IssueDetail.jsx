import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/authContext';
import MapPicker from '../components/MapPicker';

const STATUS_STYLES = {
  reported: 'bg-amber-100 text-amber-700',
  acknowledged: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-emerald-100 text-emerald-700',
};
const STATUS_DOTS = {
  reported: 'bg-amber-500',
  acknowledged: 'bg-blue-500',
  in_progress: 'bg-purple-500',
  resolved: 'bg-emerald-500',
};
const CATEGORY_ICONS = {
  pothole: '🕳️', garbage: '🗑️', streetlight: '💡', water: '💧', traffic: '🚦', other: '📍',
};

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null); // { issue, events, comments }
  const [error, setError] = useState('');
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // useCallback: stable function identity → safe as a useEffect dependency
  const loadIssue = useCallback(() => {
    api.get(`/issues/${id}`)
      .then((res) => {
        setData(res.data);
        setUpvoteCount(res.data.issue.upvotes.length);
        setUpvoted(user ? res.data.issue.upvotes.includes(user._id) : false);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load issue'));
  }, [id, user]);

  useEffect(() => {
    loadIssue();
  }, [loadIssue]);

  const handleUpvote = async () => {
    if (!user) return navigate('/login');
    try {
      const res = await api.post(`/issues/${id}/upvote`);
      setUpvoteCount(res.data.upvoteCount);
      setUpvoted(res.data.upvoted);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upvote');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      await api.post(`/issues/${id}/comments`, { text: commentText });
      setCommentText('');
      loadIssue(); // refetch → new comment appears
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to comment');
    } finally {
      setPosting(false);
    }
  };
  const applyStatus = async () => {
  if (!newStatus) return;
  setUpdatingStatus(true);
  try {
    await api.patch(`/issues/${id}/status`, { status: newStatus, note: statusNote });
    setNewStatus(''); setStatusNote('');
    loadIssue(); // refetch → status badge + timeline both refresh
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to update status');
  } finally {
    setUpdatingStatus(false);
  }
};
  if (error) return <p className="max-w-2xl mx-auto mt-16 text-center text-red-600">{error}</p>;
  if (!data) return <p className="text-center text-gray-500 py-16">Loading…</p>;

  const { issue, events, comments } = data;
  const [lng, lat] = issue.location.coordinates; // GeoJSON stores [lng, lat] — destructure backwards!

  return (
    <div className="max-w-4xl mx-auto px-4 mt-8">
      <Link to="/" className="text-sm text-emerald-600">← Back to feed</Link>

      <div className="bg-white rounded-xl shadow-md overflow-hidden mt-3">
        <img src={issue.photoUrl} alt={issue.title} className="h-72 w-full object-cover" />

        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {CATEGORY_ICONS[issue.category]} {issue.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[issue.status]}`}>
              {issue.status.replace('_', ' ')}
            </span>
          </div>

          <h1 className="text-2xl font-bold mt-2">{issue.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {issue.address || 'Pinned on map'} · {new Date(issue.createdAt).toLocaleDateString()} · by {issue.reportedBy?.name}
          </p>
          {user?.role === 'admin' && (
  <div className="mt-6 border-2 border-emerald-200 bg-emerald-50/50 rounded-xl p-4">
    <h3 className="font-semibold text-emerald-800">🛡️ Admin actions</h3>
    <p className="text-xs text-gray-600 mt-1">
      Status changes are public — they appear on this issue's timeline with your name.
    </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Choose next status…</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <input value={statusNote} onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Note (optional) — e.g. 'Crew dispatched'"
            className="flex-1 min-w-48 border rounded-lg px-3 py-2 text-sm" />
          <button onClick={applyStatus} disabled={!newStatus || updatingStatus}
            className="bg-emerald-600 text-white px-4 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            {updatingStatus ? 'Updating…' : 'Update status'}
          </button>
        </div>
      </div>
    )}
          <button onClick={handleUpvote}
            className={`mt-4 flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm transition-colors ${
              upvoted ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'hover:bg-gray-50'
            }`}>
            👍 {upvoteCount} — {upvoted ? 'You see this too' : 'I see this too'}
          </button>

          <p className="mt-5 text-gray-700 whitespace-pre-line">{issue.description}</p>

          {/* Reusing MapPicker in read-only mode (no onPick) */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Location</h3>
            <MapPicker position={[lat, lng]} defaultCenter={[lat, lng]} />
          </div>

          {/* Status timeline */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Status timeline</h3>
            <ol className="space-y-3">
              {events.map((ev) => (
                <li key={ev._id} className="flex gap-3 items-start">
                  <span className={`mt-1.5 h-3 w-3 rounded-full shrink-0 ${STATUS_DOTS[ev.status]}`}></span>
                  <div>
                    <p className="text-sm font-medium capitalize">{ev.status.replace('_', ' ')}</p>
                    {ev.note && <p className="text-sm text-gray-600">{ev.note}</p>}
                    <p className="text-xs text-gray-400">
                      {new Date(ev.createdAt).toLocaleString()} · {ev.changedBy?.name}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Comments */}
          <div className="mt-8">
            <h3 className="font-semibold mb-3">Comments ({comments.length})</h3>

            {user ? (
              <form onSubmit={handleComment} className="flex gap-2 mb-4">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a constructive comment…"
                  maxLength={500} required
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button disabled={posting}
                  className="bg-emerald-600 text-white px-4 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                  {posting ? '…' : 'Post'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                <Link to="/login" className="text-emerald-600 font-medium">Log in</Link> to comment or upvote.
              </p>
            )}

            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c._id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm">{c.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {c.author?.name} · {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}