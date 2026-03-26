import { json } from '../lib/response';

interface Env {
  DB: D1Database;
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
}

interface WorkerStats {
  requests: { today: number; limit: number };
  errors: number;
  subrequests: number;
  cpuTime: { p50: number; p99: number };
}

interface BlogStats {
  posts: number;
  totalViews: number;
  topPosts: { title: string; slug: string; views: number }[];
}

// Module-level cache — persists within the same Worker isolate
let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function handleStats(env: Env): Promise<Response> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return json({ ...cache.data as object, cached: true });
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const [blogResult, workerResult] = await Promise.allSettled([
    getBlogStats(env.DB),
    getWorkerStats(env.CF_API_TOKEN, env.CF_ACCOUNT_ID, today),
  ]);

  const result = {
    blog: blogResult.status === 'fulfilled' ? blogResult.value : null,
    worker: workerResult.status === 'fulfilled' ? workerResult.value : null,
    limits: {
      requests: { daily: 100_000 },
      d1Reads: { daily: 5_000_000 },
      d1Writes: { daily: 100_000 },
    },
    updatedAt: new Date().toISOString(),
    cached: false,
  };

  cache = { data: result, ts: Date.now() };
  return json(result);
}

async function getBlogStats(db: D1Database): Promise<BlogStats> {
  const [counts, topPosts] = await Promise.all([
    db
      .prepare('SELECT COUNT(*) as posts, SUM(views) as views FROM posts WHERE published = 1')
      .first<{ posts: number; views: number }>(),
    db
      .prepare('SELECT title, slug, views FROM posts WHERE published = 1 ORDER BY views DESC LIMIT 5')
      .all<{ title: string; slug: string; views: number }>(),
  ]);
  return {
    posts: counts?.posts ?? 0,
    totalViews: counts?.views ?? 0,
    topPosts: topPosts.results,
  };
}

async function getWorkerStats(
  token: string | undefined,
  accountId: string | undefined,
  today: string,
): Promise<WorkerStats | null> {
  if (!token || !accountId) return null;

  const query = `{
    viewer {
      accounts(filter: {accountTag: "${accountId}"}) {
        workersInvocationsAdaptive(
          limit: 1
          filter: {
            date_geq: "${today}"
            date_leq: "${today}"
            scriptName: "holes"
          }
        ) {
          sum { requests errors subrequests }
          quantiles { cpuTimeP50 cpuTimeP99 }
        }
      }
    }
  }`;

  let res: Response;
  try {
    res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const data = (await res.json()) as {
    data?: {
      viewer?: {
        accounts?: Array<{
          workersInvocationsAdaptive?: Array<{
            sum?: { requests: number; errors: number; subrequests: number };
            quantiles?: { cpuTimeP50: number; cpuTimeP99: number };
          }>;
        }>;
      };
    };
  };

  const inv = data?.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive?.[0];

  return {
    requests: { today: inv?.sum?.requests ?? 0, limit: 100_000 },
    errors: inv?.sum?.errors ?? 0,
    subrequests: inv?.sum?.subrequests ?? 0,
    cpuTime: {
      p50: Math.round((inv?.quantiles?.cpuTimeP50 ?? 0) / 1000), // µs → ms *1000, display as µs
      p99: Math.round((inv?.quantiles?.cpuTimeP99 ?? 0) / 1000),
    },
  };
}
