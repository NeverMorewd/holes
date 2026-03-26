import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked } from 'marked'
import { api, type Post } from '../lib/api'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api.posts.get(slug).then(res => {
      if (res.success && res.data) {
        setPost(res.data)
      } else {
        setError(res.error?.message ?? 'Post not found')
      }
    }).catch(() => setError('Network error')).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="loading">LOADING TRANSMISSION</div>
  if (error) return (
    <div>
      <div className="error-msg">ERROR: {error}</div>
      <br />
      <Link to="/blog" className="btn btn-sm">&lt; BACK TO LOG</Link>
    </div>
  )
  if (!post) return null

  const htmlContent = marked(post.content) as string

  return (
    <article>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/blog" className="btn btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
          &lt; BACK TO LOG
        </Link>
        <h1 style={{ textTransform: 'none', fontSize: '1.6rem', marginBottom: '0.75rem' }}>
          {post.title}
        </h1>
        <div className="post-meta">
          <span className="post-date">{post.created_at.slice(0, 10)}</span>
          <span className="post-views">{post.views} READS</span>
          {post.tags.map(t => (
            <Link key={t} to={`/blog?tag=${encodeURIComponent(t)}`} className="tag">{t}</Link>
          ))}
        </div>
      </div>

      <div className="panel">
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/blog" className="btn">&lt; BACK TO LOG</Link>
      </div>
    </article>
  )
}
