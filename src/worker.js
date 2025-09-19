// Simple router without external dependencies
const router = {
  routes: new Map(),
  get: function(path, handler) { this.routes.set(`GET ${path}`, handler); },
  post: function(path, handler) { this.routes.set(`POST ${path}`, handler); },
  options: function(path, handler) { this.routes.set(`OPTIONS ${path}`, handler); },
  handle: async function(request, env, ctx) {
    const url = new URL(request.url);
    const key = `${request.method} ${url.pathname}`;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: getCorsHeaders(request) });
    }

    // Find exact match first
    if (this.routes.has(key)) {
      return await this.routes.get(key)(request, env, ctx);
    }

    // Handle wildcard routes
    for (const [routeKey, handler] of this.routes.entries()) {
      if (routeKey.includes('*') && key.startsWith(routeKey.replace('*', ''))) {
        return await handler(request, env, ctx);
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};

// CORS headers - function to get dynamic origin for credentials
const getCorsHeaders = (request) => {
  const origin = request.headers.get('Origin');

  // Allow specific origins (Netlify domains and localhost for development)
  const allowedOrigins = [
    'https://mygratitude.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  // Check if origin is from Netlify or in allowed list
  let corsOrigin = allowedOrigins[0]; // default

  if (origin) {
    if (allowedOrigins.includes(origin) ||
        origin.endsWith('.netlify.app') ||
        origin.includes('netlify.com')) {
      corsOrigin = origin;
    }
  }

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
};

// Handle CORS preflight is handled in the router.handle method

// User registration
router.post('/api/auth/register', async (request, env) => {
  try {
    const { email, password, name } = await request.json();

    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);

    await env.DB.prepare(
      'INSERT INTO users (id, email, password, name, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, email, hashedPassword, name, new Date().toISOString()).run();

    const session = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(session, userId, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()).run();

    return new Response(JSON.stringify({
      id: userId,
      email,
      name,
      token: session
    }), {
      headers: {
        ...getCorsHeaders(request),
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Registration failed' }), {
      status: 400,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
});

// User login
router.post('/api/auth/login', async (request, env) => {
  try {
    const { email, password } = await request.json();

    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

    if (!user || !await verifyPassword(password, user.password)) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const session = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(session, user.id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()).run();

    return new Response(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      token: session
    }), {
      headers: {
        ...getCorsHeaders(request),
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 400,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
});

// Get current user
router.get('/api/auth/me', async (request, env) => {
  const token = getAuthToken(request);

  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  const session = await env.DB.prepare(
    'SELECT users.* FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.id = ? AND sessions.expires_at > ?'
  ).bind(token, new Date().toISOString()).first();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    id: session.id,
    email: session.email,
    name: session.name
  }), {
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
});

// Logout
router.post('/api/auth/logout', async (request, env) => {
  const sessionId = getCookieValue(request.headers.get('Cookie'), 'session');

  if (sessionId) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }

  return new Response(JSON.stringify({ message: 'Logged out' }), {
    headers: {
      ...getCorsHeaders(request),
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/'
    }
  });
});

// Save journal entry
router.post('/api/journal', async (request, env) => {
  const token = getAuthToken(request);

  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  const session = await env.DB.prepare(
    'SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?'
  ).bind(token, new Date().toISOString()).first();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  const entry = await request.json();
  const date = entry.date || new Date().toISOString().split('T')[0];

  // First, check if an entry already exists for this date
  const existingEntry = await env.DB.prepare(
    'SELECT id FROM journal_entries WHERE user_id = ? AND date = ?'
  ).bind(session.user_id, date).first();

  const entryId = existingEntry ? existingEntry.id : crypto.randomUUID();

  await env.DB.prepare(`
    INSERT OR REPLACE INTO journal_entries
    (id, user_id, date, morning_gratitude1, morning_gratitude2, morning_gratitude3,
     morning_intention, morning_prayer, evening_reflection1, evening_reflection2,
     evening_reflection3, evening_learning, evening_gratitude, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    entryId, session.user_id, date,
    entry.morningGratitude1 || null, entry.morningGratitude2 || null, entry.morningGratitude3 || null,
    entry.morningIntention || null, entry.morningPrayer || null,
    entry.eveningReflection1 || null, entry.eveningReflection2 || null, entry.eveningReflection3 || null,
    entry.eveningLearning || null, entry.eveningGratitude || null,
    new Date().toISOString()
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
});

// Get journal entry
router.get('/api/journal', async (request, env) => {
  const token = getAuthToken(request);

  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  const session = await env.DB.prepare(
    'SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?'
  ).bind(token, new Date().toISOString()).first();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  const entry = await env.DB.prepare(
    'SELECT * FROM journal_entries WHERE user_id = ? AND date = ?'
  ).bind(session.user_id, date).first();

  return new Response(JSON.stringify(entry || {}), {
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
});

// Delete journal entry
router.post('/api/journal/delete', async (request, env) => {
  const token = getAuthToken(request);

  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  const session = await env.DB.prepare(
    'SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?'
  ).bind(token, new Date().toISOString()).first();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  const { date } = await request.json();
  const deleteDate = date || new Date().toISOString().split('T')[0];

  await env.DB.prepare(
    'DELETE FROM journal_entries WHERE user_id = ? AND date = ?'
  ).bind(session.user_id, deleteDate).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
});

// Get list of dates with entries
router.get('/api/journal/dates', async (request, env) => {
  const token = getAuthToken(request);

  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  const session = await env.DB.prepare(
    'SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?'
  ).bind(token, new Date().toISOString()).first();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  const dates = await env.DB.prepare(
    'SELECT date FROM journal_entries WHERE user_id = ? ORDER BY date DESC'
  ).bind(session.user_id).all();

  return new Response(JSON.stringify(dates.results || []), {
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
});

// Helper functions
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  return await hashPassword(password) === hash;
}

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

function getAuthToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// 404 handler is built into the router.handle method

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
};