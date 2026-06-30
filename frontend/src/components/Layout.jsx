import { Link, NavLink } from 'react-router-dom';

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`;

export default function Layout({ user, onSignOut, children }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-slate-900 no-underline">
            Campus Event Finder
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink to="/" className={navClass} end>
              Events
            </NavLink>
            <NavLink to="/saved" className={navClass}>
              Saved
            </NavLink>
            <NavLink to="/create" className={navClass}>
              Create
            </NavLink>
            {user ? (
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
              >
                Sign out
              </button>
            ) : (
              <NavLink to="/auth" className={navClass}>
                Sign in
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
