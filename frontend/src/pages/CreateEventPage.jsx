import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const initialForm = {
  title: '',
  description: '',
  category: 'General',
  location: '',
  event_date: '',
};

export default function CreateEventPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-xl border bg-white p-6">
      <h1 className="text-xl font-semibold">Create event</h1>
      <p className="mt-1 text-sm text-slate-600">Share your campus event with students.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Event title"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
        />
        <textarea
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
        />
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
        />
        <input
          required
          type="datetime-local"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.event_date}
          onChange={(e) => setForm((prev) => ({ ...prev, event_date: e.target.value }))}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create event'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
