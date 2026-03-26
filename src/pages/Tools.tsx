import { useState } from 'react'
import { api, type WeatherData, type ExchangeData } from '../lib/api'

const WMO_CODES: Record<number, string> = {
  0: 'CLEAR', 1: 'MOSTLY CLR', 2: 'PARTLY CLD', 3: 'OVERCAST',
  45: 'FOG', 48: 'ICING FOG', 51: 'DRIZZLE L', 53: 'DRIZZLE M', 55: 'DRIZZLE H',
  61: 'RAIN L', 63: 'RAIN M', 65: 'RAIN H',
  71: 'SNOW L', 73: 'SNOW M', 75: 'SNOW H',
  80: 'SHOWERS L', 81: 'SHOWERS M', 82: 'SHOWERS H',
  85: 'SNOW SHW L', 86: 'SNOW SHW H',
  95: 'STORM', 96: 'STORM+HAIL', 99: 'STORM+HAIL',
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function WeatherWidget() {
  const [city, setCity] = useState('Beijing')
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    if (!city.trim()) return
    setLoading(true); setError(null); setData(null)
    const res = await api.weather(city.trim()).catch(() => null)
    setLoading(false)
    if (!res || !res.success || !res.data) {
      setError(res?.error?.message ?? 'Request failed')
    } else {
      setData(res.data)
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">WEATHER SCAN</span>
        {data && <span style={{ fontSize: '0.78rem', color: 'var(--green-dim)' }}>{data.city}, {data.country}</span>}
      </div>

      <div className="input-row">
        <div className="form-group">
          <label>CITY NAME</label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="e.g. Tokyo, London, Beijing"
          />
        </div>
        <button className="btn" onClick={search} disabled={loading}>
          {loading ? 'SCANNING' : 'SCAN'}
        </button>
      </div>

      {error && <div className="error-msg">ERROR: {error}</div>}

      {data && (
        <div style={{ marginTop: '1rem' }}>
          {data.weather.current_weather && (
            <div style={{ marginBottom: '0.75rem', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--green-dim)' }}>CURRENT: </span>
              <span className="status-ok" style={{ fontSize: '1.1rem' }}>
                {data.weather.current_weather.temperature}°C
              </span>
              <span style={{ color: 'var(--green-dim)', marginLeft: '1rem' }}>
                WIND {data.weather.current_weather.windspeed} km/h
              </span>
            </div>
          )}
          <div className="weather-grid">
            {data.weather.daily.time.map((date, i) => {
              const d = new Date(date)
              return (
                <div key={date} className="weather-day">
                  <div className="weather-day-name">{DAYS[d.getDay()]}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--green-dim)', marginBottom: '0.25rem' }}>
                    {WMO_CODES[data.weather.daily.weathercode?.[i]] ?? '---'}
                  </div>
                  <div className="weather-temp-max">{data.weather.daily.temperature_2m_max[i]}°</div>
                  <div className="weather-temp-min">{data.weather.daily.temperature_2m_min[i]}°</div>
                  {data.weather.daily.precipitation_sum[i] > 0 && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--green-dim)' }}>
                      {data.weather.daily.precipitation_sum[i]}mm
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD', 'KRW', 'SGD', 'AUD', 'CAD']

function ExchangeWidget() {
  const [from, setFrom] = useState('CNY')
  const [to, setTo] = useState('USD')
  const [amount, setAmount] = useState('100')
  const [data, setData] = useState<ExchangeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function convert() {
    const amt = Number(amount)
    if (!from || !to || isNaN(amt)) return
    setLoading(true); setError(null); setData(null)
    const res = await api.exchange(from, to, amt).catch(() => null)
    setLoading(false)
    if (!res || !res.success || !res.data) {
      setError(res?.error?.message ?? 'Request failed')
    } else {
      setData(res.data)
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">EXCHANGE CONVERTER</span>
        {data && (
          <span style={{ fontSize: '0.78rem', color: 'var(--green-dim)' }}>
            1 {data.from} = {data.rate.toFixed(6)} {data.to}
          </span>
        )}
      </div>

      <div className="input-row" style={{ marginBottom: '0.75rem' }}>
        <div className="form-group">
          <label>FROM</label>
          <select value={from} onChange={e => setFrom(e.target.value)}>
            {COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>TO</label>
          <select value={to} onChange={e => setTo(e.target.value)}>
            {COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="input-row">
        <div className="form-group">
          <label>AMOUNT</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && convert()}
            min="0"
            step="any"
          />
        </div>
        <button className="btn" onClick={convert} disabled={loading}>
          {loading ? 'CONVERTING' : 'CONVERT'}
        </button>
      </div>

      {error && <div className="error-msg">ERROR: {error}</div>}

      {data && (
        <div style={{ marginTop: '1rem' }}>
          <div className="exchange-result">
            {data.amount} {data.from} = {data.converted.toFixed(4)} {data.to}
          </div>
          <div className="exchange-rate">
            RATE: 1 {data.from} = {data.rate.toFixed(6)} {data.to}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Tools() {
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>FIELD TOOLS</h2>
      <div className="tools-grid">
        <WeatherWidget />
        <ExchangeWidget />
      </div>
    </div>
  )
}
