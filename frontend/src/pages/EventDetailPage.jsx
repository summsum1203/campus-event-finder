import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function EventDetailPage({ user }) {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await apiFetch(`/api/events/${id}`);
        if (isMounted) {
          setEvent(result.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const saveEvent = async () => {
    try {
      await apiFetch(`/api/bookmarks/${id}`, { method: 'POST' });
      setMessage('Event saved to bookmarks.');
      setError('');
    } catch (err) {
      setError(err.message);
      setMessage('');
    }
  };

  if (loading) return <p>Loading event...</p>;
  if (error && !event) return <p className="text-red-600">{error}</p>;

  return (
    <article className="space-y-4 rounded-xl border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{event?.title}</h1>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{event?.category}</span>
      </div>
      <p className="text-slate-700">{event?.description || 'No description provided.'}</p>
      <p className="text-sm text-slate-600">When: {new Date(event?.event_date).toLocaleString()}</p>
      <p className="text-sm text-slate-600">Where: {event?.location || 'TBD'}</p>

      {user ? (
        <button
          type="button"
          onClick={saveEvent}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save event
        </button>
      ) : (
        <p className="text-sm text-slate-600">Sign in to save this event.</p>
      )}

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </article>
  );
}
