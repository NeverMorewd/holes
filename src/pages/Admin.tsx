import { useEffect, useState } from 'react'
import { marked } from 'marked'
import { api, type Post } from '../lib/api'

const STORAGE_KEY = 'admin_api_key'

type View = 'login' | 'list' | 'editor'

interface PostForm {
  title: string
  slug: string
  summary: string
  tags: string
  content: string
  published: boolean
}

const emptyForm: PostForm = {
  title: '', slug: '', summary: '', tags: '', content: '', published: false,
}

function slugify(title: string) {
  return title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function Admin() {
  const [view, setView] = useState<View>('login')
  const [apiKey, setApiKey] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<PostForm>(emptyForm)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) { setApiKey(saved); setView('list') }
  }, [])

  useEffect(() => {
    if (view === 'list' && apiKey) loadPosts()
  }, [view, apiKey])

  async function loadPosts() {
    setLoading(true)
    setError(null)
    const res = await api.posts.listAll(apiKey).catch(() => null)
    setLoading(false)
    if (!res?.success) {
      setError('Failed to load — check API key')
      return
    }
    setPosts(res.data?.posts ?? [])
  }

  function login() {
    if (!keyInput.trim()) return
    localStorage.setItem(STORAGE_KEY, keyInput.trim())
    setApiKey(keyInput.trim())
    setView('list')
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setApiKey('')
    setKeyInput('')
    setView('login')
  }

  function newPost() {
    setForm(emptyForm)
    setEditingSlug(null)
    setPreview(false)
    setError(null)
    setView('editor')
  }

  function editPost(post: Post) {
    setForm({
      title: post.title,
      slug: post.slug,
      summary: post.summary ?? '',
      tags: post.tags.join(', '),
      content: post.content,
      published: post.published,
    })
    setEditingSlug(post.slug)
    setPreview(false)
    setError(null)
    setView('editor')
  }

  async function deletePost(slug: string) {
    if (!confirm(`DELETE "${slug}"?`)) return
    const res = await api.posts.remove(slug, apiKey).catch(() => null)
    if (res?.success) {
      setPosts(p => p.filter(x => x.slug !== slug))
    } else {
      setError('Delete failed')
    }
  }

  async function savePost() {
    if (!form.title || !form.slug || !form.content) {
      setError('Title, slug and content are required')
      return
    }
    setSaving(true)
    setError(null)
    const data = {
      title: form.title,
      slug: form.slug,
      summary: form.summary || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      content: form.content,
      published: form.published,
    }
    const res = editingSlug
      ? await api.posts.update(editingSlug, data, apiKey).catch(() => null)
      : await api.posts.create(data, apiKey).catch(() => null)
    setSaving(false)
    if (!res?.success) {
      setError(res?.error?.message ?? 'Save failed')
      return
    }
    setView('list')
  }

  const filtered = posts.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  // ── Login ──────────────────────────────────────────────────────────
  if (view === 'login') return (
    <div>
      <div className="panel-header" style={{ marginBottom: '1.5rem' }}>
        <h2>ADMIN ACCESS</h2>
      </div>
      <div className="panel" style={{ maxWidth: '400px' }}>
        <div style={{ marginBottom: '1rem', color: 'var(--green-dim)', fontSize: '0.85rem' }}>
          ENTER API KEY TO CONTINUE
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="API KEY"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
        </div>
        <button className="btn" onClick={login}>ACCESS</button>
      </div>
    </div>
  )

  // ── Editor ─────────────────────────────────────────────────────────
  if (view === 'editor') return (
    <div>
      <div className="panel-header" style={{ marginBottom: '1.5rem' }}>
        <h2>{editingSlug ? 'EDIT TRANSMISSION' : 'NEW TRANSMISSION'}</h2>
        <button className="btn btn-sm" onClick={() => setView('list')}>CANCEL</button>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>ERROR: {error}</div>}

      <div className="panel">
        <div className="form-group">
          <label>TITLE</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({
              ...f,
              title: e.target.value,
              slug: editingSlug ? f.slug : slugify(e.target.value),
            }))}
          />
        </div>
        <div className="form-group">
          <label>SLUG</label>
          <input
            type="text"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>SUMMARY</label>
          <input
            type="text"
            value={form.summary}
            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>TAGS (comma separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <label style={{ margin: 0 }}>PUBLISHED</label>
          <input
            type="checkbox"
            checked={form.published}
            onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
            style={{ width: 'auto' }}
          />
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label style={{ margin: 0 }}>CONTENT (MARKDOWN)</label>
          <button className="btn btn-sm" onClick={() => setPreview(p => !p)}>
            {preview ? 'EDIT' : 'PREVIEW'}
          </button>
        </div>
        {preview ? (
          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: marked(form.content) as string }}
          />
        ) : (
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            style={{ minHeight: '400px', resize: 'vertical' }}
          />
        )}
      </div>

      <button className="btn" onClick={savePost} disabled={saving}>
        {saving ? 'SAVING...' : 'SAVE'}
      </button>
    </div>
  )

  // ── List ───────────────────────────────────────────────────────────
  return (
    <div>
      <div className="panel-header" style={{ marginBottom: '1.5rem' }}>
        <h2>TRANSMISSION CONTROL</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm" onClick={newPost}>+ NEW</button>
          <button className="btn btn-sm" onClick={logout}>LOGOUT</button>
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>ERROR: {error}</div>}

      <div className="form-group">
        <input
          type="text"
          placeholder="SEARCH BY TITLE OR TAG..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="loading">LOADING TRANSMISSIONS</div>}

      {!loading && (
        <div className="panel">
          {filtered.length === 0 ? (
            <div style={{ color: 'var(--green-dim)', textAlign: 'center' }}>
              NO TRANSMISSIONS FOUND
            </div>
          ) : (
            <ul className="post-list">
              {filtered.map(post => (
                <li key={post.slug} className="post-item">
                  <div className="post-item-inner" style={{ cursor: 'default' }}>
                    <div className="post-meta">
                      <span className="post-date">{post.created_at.slice(0, 10)}</span>
                      <span className="post-views">{post.views} READS</span>
                      <span style={{ color: post.published ? 'var(--green-bright)' : 'var(--green-dim)' }}>
                        {post.published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <div className="post-title" style={{ flex: 1 }}>{post.title}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button className="btn btn-sm" onClick={() => editPost(post)}>EDIT</button>
                        <button className="btn btn-sm" onClick={() => deletePost(post.slug)}>DEL</button>
                      </div>
                    </div>
                    {post.tags.length > 0 && (
                      <div className="post-tags">
                        {post.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
