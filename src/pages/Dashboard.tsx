import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

interface StatsData {
  blog: {
    posts: number
    totalViews: number
    topPosts: { title: string; slug: string; views: number }[]
  } | null
  worker: {
    requests: { today: number; limit: number }
    errors: number
    subrequests: number
    cpuTime: { p50: number; p99: number }
  } | null
  limits: {
    requests: { daily: number }
    d1Reads: { daily: number }
    d1Writes: { daily: number }
  }
  updatedAt: string
  cached: boolean
}

function ProgressBar({ value, max, warn = 70, danger = 90 }: {
  value: number; max: number; warn?: number; danger?: number
}) {
  const pct = Math.min(100, (value / max) * 100)
  const color = pct >= danger
    ? 'var(--error)'
    : pct >= warn
    ? 'var(--warning)'
    : 'var(--green)'

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{
        height: 8,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: `${pct}%`,
          background: color,
          boxShadow: `0 0 6px ${color}`,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: 'var(--green-dim)',
        marginTop: '0.25rem',
      }}>
        <span style={{ color }}>{pct.toFixed(1)}% used</span>
        <span>{value.toLocaleString()} / {max.toLocaleString()}</span>
      </div>
    </div>
  )
}

function MetricBox({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      background: 'var(--bg)',
      padding: '0.75rem 1rem',
      flex: 1,
      minWidth: 120,
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--green-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.4rem', color: 'var(--green-bright)', textShadow: '0 0 8px var(--green)' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span style={{ fontSize: '0.75rem', color: 'var(--green-dim)', marginLeft: '0.3rem' }}>{unit}</span>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    const res = await api.stats().catch(() => null)
    setLoading(false)
    if (!res || !res.success || !res.data) {
      setError(res?.error?.message ?? 'Failed to load stats')
    } else {
      setStats(res.data as StatsData)
    }
  }

  useEffect(() => { load() }, [])

  const updatedTime = stats
    ? new Date(stats.updatedAt).toLocaleTimeString('en', { hour12: false })
    : null

  return (
    <div>
      <div className="panel-header" style={{ marginBottom: '1.5rem' }}>
        <h2>SYSTEM METRICS</h2>
        {updatedTime && (
          <span style={{ fontSize: '0.78rem', color: 'var(--green-dim)' }}>
            {stats?.cached ? 'CACHED' : 'LIVE'} // {updatedTime}
            <button
              className="btn btn-sm"
              onClick={load}
              style={{ marginLeft: '1rem' }}
            >
              REFRESH
            </button>
          </span>
        )}
      </div>

      {loading && <div className="loading">FETCHING TELEMETRY</div>}
      {error && <div className="error-msg">ERROR: {error}</div>}

      {stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Worker requests */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">WORKER REQUESTS TODAY</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--green-dim)' }}>
                FREE LIMIT: 100,000 / day
              </span>
            </div>
            {stats.worker ? (
              <>
                <ProgressBar
                  value={stats.worker.requests.today}
                  max={stats.worker.requests.limit}
                />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <MetricBox label="Requests" value={stats.worker.requests.today} />
                  <MetricBox label="Errors" value={stats.worker.errors} />
                  <MetricBox label="Subrequests" value={stats.worker.subrequests} />
                  <MetricBox label="CPU P50" value={stats.worker.cpuTime.p50} unit="µs" />
                  <MetricBox label="CPU P99" value={stats.worker.cpuTime.p99} unit="µs" />
                </div>
                {stats.worker.errors > 0 && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                    <span className="status-warn">
                      ERROR RATE: {((stats.worker.errors / Math.max(1, stats.worker.requests.today)) * 100).toFixed(2)}%
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--green-dim)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                CF_API_TOKEN or CF_ACCOUNT_ID not configured
              </div>
            )}
          </div>

          {/* Blog stats */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">BLOG STATS</span>
            </div>
            {stats.blog ? (
              <>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <MetricBox label="Published Posts" value={stats.blog.posts} />
                  <MetricBox label="Total Reads" value={stats.blog.totalViews} />
                </div>
                {stats.blog.topPosts.length > 0 && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--green-dim)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                      TOP POSTS
                    </div>
                    {stats.blog.topPosts.map((post, i) => (
                      <div key={post.slug} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.4rem 0',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '0.85rem',
                      }}>
                        <span style={{ color: 'var(--green-dim)', minWidth: 20 }}>#{i + 1}</span>
                        <Link
                          to={`/blog/${post.slug}`}
                          style={{ flex: 1, color: 'var(--green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {post.title}
                        </Link>
                        <span style={{ color: 'var(--green-bright)', minWidth: 80, textAlign: 'right' }}>
                          {post.views.toLocaleString()} reads
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--green-dim)', fontSize: '0.85rem' }}>No data</div>
            )}
          </div>

          {/* Free tier reference */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">FREE TIER LIMITS</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--green-dim)' }}>resets daily</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              {[
                { label: 'Worker Requests', value: '100,000 / day', note: 'includes static asset requests' },
                { label: 'D1 Row Reads', value: '5,000,000 / day', note: 'each blog query reads ~1–10 rows' },
                { label: 'D1 Row Writes', value: '100,000 / day', note: 'view counter increments on each post read' },
                { label: 'D1 Storage', value: '5 GB total', note: 'markdown posts are tiny' },
              ].map(row => (
                <div key={row.label} className="terminal-line" style={{ fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--green)', minWidth: 180 }}>{row.label}</span>
                  <span style={{ color: 'var(--green-bright)', minWidth: 160 }}>{row.value}</span>
                  <span style={{ color: 'var(--green-dim)' }}># {row.note}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
