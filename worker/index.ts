import { handleExchange } from './api/exchange';
import { handleWeather } from './api/weather';
import { handlePosts, handlePost } from './api/posts';
import { handleStats } from './api/stats';
import { json } from './lib/response';

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_API_KEY?: string;
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // API routes
    if (url.pathname.startsWith('/api/')) {
      const response = await handleApi(request, url, env);
      // Add CORS headers to all API responses
      const newHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        newHeaders.set(key, value);
      }
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    // Serve static assets (React app)
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

async function handleApi(request: Request, url: URL, env: Env): Promise<Response> {
  const path = url.pathname.replace(/^\/api\/v1/, '');
  const segments = path.split('/').filter(Boolean);

  // Health check
  if (segments[0] === 'health') {
    return json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Weather
  if (segments[0] === 'weather') {
    return handleWeather(url.searchParams);
  }

  // Exchange
  if (segments[0] === 'exchange') {
    return handleExchange(url.searchParams);
  }

  // Posts
  if (segments[0] === 'posts') {
    const slug = segments[1];
    if (slug) {
      return handlePost(request, env.DB, slug, env.ADMIN_API_KEY);
    }
    return handlePosts(request, env.DB, env.ADMIN_API_KEY);
  }

  // Stats / dashboard
  if (segments[0] === 'stats') {
    return handleStats(env);
  }

  return json({ error: 'Not found' }, 404);
}
