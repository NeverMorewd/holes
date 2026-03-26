import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Post } from '../lib/api'

export default function Home() {
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [status, setStatus] = useState<'ok' | 'checking' | 'error'>('checking')

  useEffect(() => {
    api.health().then(r => setStatus(r.success ? 'ok' : 'error')).catch(() => setStatus('error'))
    api.posts.list(1).then(r => {
      if (r.success && r.data) setRecentPosts(r.data.posts.slice(0, 3))
    })
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title glow-text cursor">HOLES.DEV</h1>
        <p className="hero-subtitle">PERSONAL TERMINAL // DIGITAL WASTELAND</p>
        <div className="hero-divider" />
        <p style={{ color: 'var(--green-dim)', maxWidth: 560, margin: '0 auto 2rem', fontSize: '0.92rem' }}>
          Welcome, wanderer. This is my personal corner of the internet.
          A place for thoughts, experiments, and useful tools.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/blog" className="btn">ENTER BLOG</Link>
          <Link to="/tools" className="btn">OPEN TOOLS</Link>
        </div>
      </section>

      {/* System status */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">SYSTEM STATUS</span>
          <span className={`status-${status === 'ok' ? 'ok' : status === 'error' ? 'err' : 'warn'}`}>
            {status === 'ok' ? '[ ONLINE ]' : status === 'error' ? '[ OFFLINE ]' : '[ CHECKING ]'}
          </span>
        </div>
        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-value">2</span>
            <span className="stat-label">TOOLS</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{recentPosts.length > 0 ? '1+' : '0'}</span>
            <span className="stat-label">POSTS</span>
          </div>
          <div className="stat-item">
            <span className="stat-value status-ok">ON</span>
            <span className="stat-label">CLOUDFLARE</span>
          </div>
        </div>
      </div>

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">RECENT TRANSMISSIONS</span>
            <Link to="/blog" className="btn btn-sm">VIEW ALL</Link>
          </div>
          <ul className="post-list">
            {recentPosts.map(post => (
              <li key={post.slug} className="post-item">
                <Link to={`/blog/${post.slug}`} className="post-item-inner">
                  <div className="post-meta">
                    <span className="post-date">{post.created_at.slice(0, 10)}</span>
                    {post.tags.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                  <div className="post-title">{post.title}</div>
                  {post.summary && <div className="post-summary">{post.summary}</div>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* API quick reference */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">API ENDPOINTS</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--green-dim)' }}>v1</span>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--green-dim)' }}>
          {[
            ['GET', '/api/v1/health', 'System health check'],
            ['GET', '/api/v1/weather?city=Beijing', '7-day weather forecast'],
            ['GET', '/api/v1/exchange?from=CNY&to=USD&amount=100', 'Currency exchange rate'],
            ['GET', '/api/v1/posts', 'List blog posts'],
            ['GET', '/api/v1/posts/:slug', 'Get single post'],
          ].map(([method, path, desc]) => (
            <div key={path} className="terminal-line" style={{ marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--green-bright)', minWidth: 45 }}>{method}</span>
              <span style={{ color: 'var(--green)', flex: 1 }}>{path}</span>
              <span style={{ color: 'var(--green-dim)', fontSize: '0.78rem' }}># {desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
