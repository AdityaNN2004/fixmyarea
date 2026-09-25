import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import MapPicker from '../components/MapPicker';

const CATEGORIES = ['pothole', 'garbage', 'streetlight', 'water', 'traffic', 'other'];
const DEFAULT_CENTER = [19.076, 72.8777]; // Mumbai — change to your city

export default function ReportIssue() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'pothole', address: '' });
  const [position, setPosition] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) return setError('Click the map to pin the issue location');
    if (!file) return setError('Please attach a photo');

    setError('');
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('category', form.category);
      data.append('address', form.address);
      data.append('lat', position[0]);
      data.append('lng', position[1]);
      data.append('photo', file);

      // No Content-Type header needed — axios detects FormData and
      // sets multipart boundaries itself. Setting it manually breaks it.
      await api.post('/issues', data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create issue');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6">Report an issue</h1>

      {error && <p className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="title" value={form.title} onChange={handleChange}
          placeholder="Short title (e.g. 'Pothole near main gate')" required maxLength={120}
          className={inputCls} />

        <div className="grid grid-cols-2 gap-4">
          <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input name="address" value={form.address} onChange={handleChange}
            placeholder="Area / landmark (optional)" className={inputCls} />
        </div>

        <textarea name="description" value={form.description} onChange={handleChange}
          placeholder="Describe the problem…" required rows={4} className={inputCls} />

        <div>
          <label className="block text-sm text-gray-600 mb-1">Photo (required, max 5MB)</label>
          <input type="file" accept="image/*" onChange={handleFile} required
            className="text-sm" />
          {preview && <img src={preview} alt="preview" className="mt-2 h-36 rounded-lg object-cover" />}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Pin the location — click the map {position && `📍 ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`}
          </label>
          <MapPicker position={position} onPick={setPosition} defaultCenter={DEFAULT_CENTER} />
        </div>

        <button disabled={submitting}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit report'}
        </button>
      </form>
    </div>
  );
}