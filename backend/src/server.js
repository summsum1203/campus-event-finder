const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { z } = require('zod');

dotenv.config();

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || frontendOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

const eventInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(3000).optional().default(''),
  category: z.string().trim().max(100).optional().default('General'),
  location: z.string().trim().max(255).optional().default('TBD'),
  event_date: z.string().trim().min(1, 'Event date is required'),
});

function parseBearerToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice('Bearer '.length).trim();
}

function isAdmin(user) {
  return user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';
}

async function requireAuth(req, res, next) {
  try {
    const token = parseBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;
    req.token = token;
    return next();
  } catch (error) {
    return next(error);
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/events', async (req, res, next) => {
  try {
    const { query, category, date } = req.query;
    let dbQuery = supabase.from('events').select('*').order('event_date', { ascending: true });

    if (query) {
      const escaped = `%${String(query).trim()}%`;
      dbQuery = dbQuery.or(
        `title.ilike.${escaped},description.ilike.${escaped},location.ilike.${escaped},category.ilike.${escaped}`
      );
    }

    if (category) {
      dbQuery = dbQuery.eq('category', String(category));
    }

    if (date) {
      dbQuery = dbQuery.gte('event_date', `${String(date)}T00:00:00`).lt('event_date', `${String(date)}T23:59:59`);
    }

    const { data, error } = await dbQuery;
    if (error) {
      throw error;
    }

    res.json({ data: data || [] });
  } catch (error) {
    next(error);
  }
});

app.get('/api/events/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('events').select('*').eq('id', req.params.id).maybeSingle();
    if (error) {
      throw error;
    }
    if (!data) {
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/events', requireAuth, async (req, res, next) => {
  try {
    const payload = eventInputSchema.parse(req.body);
    const { data, error } = await supabase
      .from('events')
      .insert({ ...payload, created_by: req.user.id })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

app.put('/api/events/:id', requireAuth, async (req, res, next) => {
  try {
    const payload = eventInputSchema.partial().parse(req.body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const { data: existingEvent, error: readError } = await supabase
      .from('events')
      .select('id, created_by')
      .eq('id', req.params.id)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (existingEvent.created_by !== req.user.id && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'You are not allowed to edit this event' });
    }

    const { data, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/events/:id', requireAuth, async (req, res, next) => {
  try {
    const { data: existingEvent, error: readError } = await supabase
      .from('events')
      .select('id, created_by')
      .eq('id', req.params.id)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (existingEvent.created_by !== req.user.id && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'You are not allowed to delete this event' });
    }

    const { error } = await supabase.from('events').delete().eq('id', req.params.id);
    if (error) {
      throw error;
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

app.get('/api/bookmarks', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('event_id, created_at, events(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({ data: data || [] });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/bookmarks/:eventId', requireAuth, async (req, res, next) => {
  try {
    const eventId = req.params.eventId;

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .maybeSingle();
    if (eventError) {
      throw eventError;
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .upsert({ user_id: req.user.id, event_id: eventId }, { onConflict: 'user_id,event_id' })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/bookmarks/:eventId', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', req.user.id)
      .eq('event_id', req.params.eventId);

    if (error) {
      throw error;
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.flatten(),
    });
  }

  const status = error?.status || 500;
  const message = error?.message || 'Internal server error';
  return res.status(status).json({ error: message });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on http://localhost:${port}`);
});
