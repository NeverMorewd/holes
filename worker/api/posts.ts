import { json, requireAuth } from '../lib/response';

interface Post {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  tags: string | null;
  published: number;
  views: number;
  created_at: string;
  updated_at: string;
}

interface PostInput {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  tags?: string[];
  published?: boolean;
}

export async function handlePosts(
  request: Request,
  db: D1Database,
  apiKey?: string,
): Promise<Response> {
  switch (request.method) {
    case 'GET': {
      const url = new URL(request.url);
      const tag = url.searchParams.get('tag');
      const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '10')));
      const offset = (page - 1) * limit;

      const isAdmin = requireAuth(request, apiKey);
      const conditions: string[] = [];
      const baseParams: unknown[] = [];
      if (!isAdmin) { conditions.push('published = 1'); }
      if (tag) { conditions.push('tags LIKE ?'); baseParams.push(`%"${tag}"%`); }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const { results } = await db
        .prepare(`SELECT id, title, slug, summary, tags, published, views, created_at, updated_at FROM posts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(...baseParams, limit, offset)
        .all<Post>();
      const countRow = await db
        .prepare(`SELECT COUNT(*) as total FROM posts ${where}`)
        .bind(...baseParams)
        .first<{ total: number }>();

      return json({
        posts: results.map(deserializePost),
        pagination: { page, limit, total: countRow?.total ?? 0 },
      });
    }

    case 'POST': {
      if (!requireAuth(request, apiKey)) {
        return json({ message: 'Unauthorized' }, 401);
      }
      let body: PostInput;
      try {
        body = (await request.json()) as PostInput;
      } catch {
        return json({ message: 'Invalid JSON body' }, 400);
      }
      if (!body.title || !body.slug || !body.content) {
        return json({ message: 'Required fields: title, slug, content' }, 400);
      }
      const now = new Date().toISOString();
      const tagsJson = body.tags ? JSON.stringify(body.tags) : null;
      try {
        const result = await db
          .prepare(
            `INSERT INTO posts (title, slug, content, summary, tags, published, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            body.title,
            body.slug,
            body.content,
            body.summary ?? null,
            tagsJson,
            body.published ? 1 : 0,
            now,
            now,
          )
          .run();
        return json({ id: result.meta.last_row_id, slug: body.slug }, 201);
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes('UNIQUE')) {
          return json({ message: `Slug "${body.slug}" already exists` }, 409);
        }
        throw e;
      }
    }

    default:
      return json({ message: 'Method not allowed' }, 405);
  }
}

export async function handlePost(
  request: Request,
  db: D1Database,
  slug: string,
  apiKey?: string,
): Promise<Response> {
  switch (request.method) {
    case 'GET': {
      const post = await db
        .prepare(`SELECT * FROM posts WHERE slug = ? AND published = 1`)
        .bind(slug)
        .first<Post>();

      if (!post) return json({ message: 'Post not found' }, 404);

      // Increment view count (fire and forget)
      db.prepare(`UPDATE posts SET views = views + 1 WHERE slug = ?`).bind(slug).run();

      return json(deserializePost(post));
    }

    case 'PUT': {
      if (!requireAuth(request, apiKey)) {
        return json({ message: 'Unauthorized' }, 401);
      }
      let body: Partial<PostInput>;
      try {
        body = (await request.json()) as Partial<PostInput>;
      } catch {
        return json({ message: 'Invalid JSON body' }, 400);
      }
      const updates: string[] = [];
      const values: unknown[] = [];
      if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
      if (body.content !== undefined) { updates.push('content = ?'); values.push(body.content); }
      if (body.summary !== undefined) { updates.push('summary = ?'); values.push(body.summary); }
      if (body.tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(body.tags)); }
      if (body.published !== undefined) { updates.push('published = ?'); values.push(body.published ? 1 : 0); }
      if (updates.length === 0) return json({ message: 'No fields to update' }, 400);
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(slug);
      await db.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE slug = ?`).bind(...values).run();
      return json({ slug, updated: true });
    }

    case 'DELETE': {
      if (!requireAuth(request, apiKey)) {
        return json({ message: 'Unauthorized' }, 401);
      }
      await db.prepare(`DELETE FROM posts WHERE slug = ?`).bind(slug).run();
      return json({ slug, deleted: true });
    }

    default:
      return json({ message: 'Method not allowed' }, 405);
  }
}

function deserializePost(post: Post) {
  return {
    ...post,
    tags: post.tags ? (JSON.parse(post.tags) as string[]) : [],
    published: post.published === 1,
  };
}
