import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function SavedEventsPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await apiFetch('/api/bookmarks');
      setBookmarks(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const removeBookmark = async (eventId) => {
    try {
      await apiFetch(`/api/bookmarks/${eventId}`, { method: 'DELETE' });
      setBookmarks((prev) => prev.filter((item) => item.event_id !== eventId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading saved events...</p>;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Saved events</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {bookmarks.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-6 text-center text-slate-600">No saved events yet.</div>
      ) : (
        <div className="grid gap-4">
          {bookmarks.map((bookmark) => (
            <article key={bookmark.event_id} className="rounded-xl border bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">{bookmark.events?.title}</h2>
              <p className="text-sm text-slate-600">{bookmark.events?.description || 'No description provided.'}</p>
              <p className="mt-2 text-sm text-slate-700">
                {bookmark.events?.event_date ? new Date(bookmark.events.event_date).toLocaleString() : 'Date TBD'}
              </p>
              <div className="mt-3 flex gap-3">
                <Link to={`/events/${bookmark.event_id}`}>View details</Link>
                <button type="button" className="text-sm text-red-600" onClick={() => removeBookmark(bookmark.event_id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
