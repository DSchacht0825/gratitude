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
      return new Response(null, { headers: corsHeaders });
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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight
router.options('*', () => new Response(null, { headers: corsHeaders }));

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

    return new Response(JSON.stringify({ id: userId, email, name }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${session}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Registration failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const session = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(session, user.id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()).run();

    return new Response(JSON.stringify({ id: user.id, email: user.email, name: user.name }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${session}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Get current user
router.get('/api/auth/me', async (request, env) => {
  const sessionId = getCookieValue(request.headers.get('Cookie'), 'session');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const session = await env.DB.prepare(
    'SELECT users.* FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.id = ? AND sessions.expires_at > ?'
  ).bind(sessionId, new Date().toISOString()).first();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    id: session.id,
    email: session.email,
    name: session.name
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    }
  });
});

// Save journal entry
router.post('/api/journal', async (request, env) => {
  const sessionId = getCookieValue(request.headers.get('Cookie'), 'session');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const session = await env.DB.prepare(
    'SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?'
  ).bind(sessionId, new Date().toISOString()).first();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const entry = await request.json();
  const today = new Date().toISOString().split('T')[0];
  const entryId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT OR REPLACE INTO journal_entries
    (id, user_id, date, morning_gratitude1, morning_gratitude2, morning_gratitude3,
     morning_intention, morning_prayer, evening_reflection1, evening_reflection2,
     evening_reflection3, evening_learning, evening_gratitude, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    entryId, session.user_id, today,
    entry.morningGratitude1, entry.morningGratitude2, entry.morningGratitude3,
    entry.morningIntention, entry.morningPrayer,
    entry.eveningReflection1, entry.eveningReflection2, entry.eveningReflection3,
    entry.eveningLearning, entry.eveningGratitude,
    new Date().toISOString()
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Get journal entry
router.get('/api/journal', async (request, env) => {
  const sessionId = getCookieValue(request.headers.get('Cookie'), 'session');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const session = await env.DB.prepare(
    'SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?'
  ).bind(sessionId, new Date().toISOString()).first();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const entry = await env.DB.prepare(
    'SELECT * FROM journal_entries WHERE user_id = ? AND date = ?'
  ).bind(session.user_id, today).first();

  return new Response(JSON.stringify(entry || {}), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

// 404 handler is built into the router.handle method

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
};