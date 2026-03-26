import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, type Post } from '../lib/api'

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const tag = searchParams.get('tag') ?? undefined
  const page = Number(searchParams.get('page') ?? '1')

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.posts.list(page, tag).then(res => {
      if (res.success && res.data) {
        setPosts(res.data.posts)
        setTotal(res.data.pagination.total)
      } else {
        setError(res.error?.message ?? 'Failed to load posts')
      }
    }).catch(() => setError('Network error')).finally(() => setLoading(false))
  }, [page, tag])

  function clearTag() {
    setSearchParams({})
  }

  return (
    <div>
      <div className="panel-header" style={{ marginBottom: '1.5rem' }}>
        <h2>TRANSMISSION LOG</h2>
        {tag && (
          <button className="btn btn-sm" onClick={clearTag}>
            [{tag}] X
          </button>
        )}
      </div>

      {loading && <div className="loading">LOADING TRANSMISSIONS</div>}
      {error && <div className="error-msg">ERROR: {error}</div>}

      {!loading && !error && posts.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', color: 'var(--green-dim)' }}>
          NO TRANSMISSIONS FOUND{tag ? ` FOR TAG "${tag}"` : ''}
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="panel">
          <ul className="post-list">
            {posts.map(post => (
              <li key={post.slug} className="post-item">
                <Link to={`/blog/${post.slug}`} className="post-item-inner">
                  <div className="post-meta">
                    <span className="post-date">{post.created_at.slice(0, 10)}</span>
                    <span className="post-views">{post.views} READS</span>
                  </div>
                  <div className="post-title">{post.title}</div>
                  {post.summary && <div className="post-summary">{post.summary}</div>}
                  {post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.map(t => (
                        <button
                          key={t}
                          className="tag"
                          onClick={e => {
                            e.preventDefault()
                            setSearchParams({ tag: t })
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          {page > 1 && (
            <button className="btn btn-sm" onClick={() => setSearchParams({ page: String(page - 1) })}>
              &lt; PREV
            </button>
          )}
          <span style={{ color: 'var(--green-dim)', fontSize: '0.85rem', lineHeight: '2rem' }}>
            PAGE {page}
          </span>
          {page * 10 < total && (
            <button className="btn btn-sm" onClick={() => setSearchParams({ page: String(page + 1) })}>
              NEXT &gt;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
