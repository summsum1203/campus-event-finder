# Campus Event Finder (MVP)

Monorepo MVP for discovering, creating, and bookmarking campus events.

## Architecture

- `frontend/` - React + Vite + Tailwind client
- `backend/` - Node.js + Express REST API
- `supabase/schema.sql` - Supabase Postgres schema + RLS policies

Frontend uses Supabase Auth for sign in/up and sends user JWTs to backend. Backend validates JWTs with Supabase and performs event/bookmark CRUD against Supabase Postgres using the service role key.

## Repository structure

- `frontend/`
  - Event list with search + filters
  - Event detail
  - Auth (sign in/sign up)
  - Create event (authenticated)
  - Saved/bookmarked events (authenticated)
- `backend/`
  - `GET /api/health`
  - `GET /api/events`
  - `GET /api/events/:id`
  - `POST /api/events` (auth)
  - `PUT /api/events/:id` (auth + owner/admin)
  - `DELETE /api/events/:id` (auth + owner/admin)
  - `GET /api/bookmarks` (auth)
  - `POST /api/bookmarks/:eventId` (auth)
  - `DELETE /api/bookmarks/:eventId` (auth)
- `supabase/schema.sql`
  - `profiles`, `events`, `bookmarks`
  - indexes and RLS policies

## Local development

### Prerequisites
- Node.js 20+
- A Supabase project

### 1) Configure backend

```bash
cd backend
cp .env.example .env
```

`backend/.env` values:
- `PORT` (default: `4000`)
- `FRONTEND_URL` (e.g. `http://localhost:5173`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET` (optional)

### 2) Configure frontend

```bash
cd frontend
cp .env.example .env
```

`frontend/.env` values:
- `VITE_API_URL` (e.g. `http://localhost:4000`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3) Install and run

```bash
# frontend
cd frontend && npm install && npm run dev

# backend (new terminal)
cd backend && npm install && npm run dev
```

Optional root scripts:
```bash
npm run dev
npm run build
npm run start
```

## Supabase setup

1. Open Supabase SQL editor.
2. Run `supabase/schema.sql`.
3. In Supabase Auth settings, ensure email/password provider is enabled.
4. (Optional) assign `app_metadata.role = "admin"` for admin users.

### RLS summary
- Events are publicly readable.
- Authenticated users can create events where `created_by = auth.uid()`.
- Only event owner or `admin` role can update/delete events.
- Bookmarks are private per user.

## Deployment

### Frontend on Vercel
Set:
- `VITE_API_URL` (Render/Railway backend URL)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Build command: `npm run build` (inside `frontend/`)
Output: `frontend/dist`

### Backend on Render (default)
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm run start`
- Environment vars: all keys from `backend/.env.example`
- Set `FRONTEND_URL` to deployed Vercel URL for production CORS

### Railway compatibility
Railway works with the same backend folder and commands:
- Install: `npm install`
- Start: `npm run start`
- Configure the same environment variables.

## Testing checklist
- [ ] Backend health endpoint returns `{ status: "ok" }`
- [ ] Sign up/sign in via Supabase Auth works
- [ ] Event list loads and filters by query/category/date
- [ ] Authenticated users can create events
- [ ] Users can bookmark and remove bookmarks
- [ ] Non-owner users cannot edit/delete others' events
