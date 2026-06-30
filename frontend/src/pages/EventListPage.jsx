import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const categories = ['All', 'Academic', 'Social', 'Sports', 'Career', 'General'];

export default function EventListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filters = useMemo(
    () => ({
      query: searchParams.get('query') || '',
      category: searchParams.get('category') || 'All',
      date: searchParams.get('date') || '',
    }),
    [searchParams]
  );

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams();
        if (filters.query) params.set('query', filters.query);
        if (filters.category && filters.category !== 'All') params.set('category', filters.category);
        if (filters.date) params.set('date', filters.date);

        const result = await apiFetch(`/api/events${params.toString() ? `?${params.toString()}` : ''}`);
        if (isMounted) {
          setEvents(result.data || []);
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
  }, [filters]);

  const onFilterChange = (name, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    if (name === 'category' && value === 'All') {
      next.delete('category');
    }
    setSearchParams(next);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Discover campus events</h1>
        <p className="text-sm text-slate-600">Find activities by category, date, and keywords.</p>
      </div>

      <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3">
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="Search title, location, category"
          value={filters.query}
          onChange={(e) => onFilterChange('query', e.target.value)}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2"
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-md border border-slate-300 px-3 py-2"
          value={filters.date}
          onChange={(e) => onFilterChange('date', e.target.value)}
        />
      </div>

      {loading && <p>Loading events...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4">
          {events.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-white p-6 text-center text-slate-600">
              No events found for current filters.
            </div>
          ) : (
            events.map((event) => (
              <article key={event.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{event.title}</h2>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{event.category}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{event.description || 'No description provided.'}</p>
                <p className="mt-3 text-sm text-slate-700">
                  {new Date(event.event_date).toLocaleString()} • {event.location || 'TBD'}
                </p>
                <Link className="mt-3 inline-block text-sm font-medium" to={`/events/${event.id}`}>
                  View details →
                </Link>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
