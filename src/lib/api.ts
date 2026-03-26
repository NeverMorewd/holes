const BASE = '/api/v1'

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: { message: string } | null
  meta: { timestamp: string; version: string }
}

export interface Post {
  id: number
  title: string
  slug: string
  summary: string | null
  content: string
  tags: string[]
  published: boolean
  views: number
  created_at: string
  updated_at: string
}

export interface PostsResponse {
  posts: Post[]
  pagination: { page: number; limit: number; total: number }
}

export interface WeatherData {
  city: string
  region?: string
  country: string
  location: { latitude: number; longitude: number }
  weather: {
    current_weather: {
      temperature: number
      windspeed: number
      weathercode: number
    }
    daily: {
      time: string[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      precipitation_sum: number[]
      weathercode: number[]
    }
  }
}

export interface ExchangeData {
  from: string
  to: string
  amount: number
  rate: number
  converted: number
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  return res.json() as Promise<ApiResponse<T>>
}

export const api = {
  weather: (city: string) =>
    apiFetch<WeatherData>(`/weather?city=${encodeURIComponent(city)}`),

  exchange: (from: string, to: string, amount: number) =>
    apiFetch<ExchangeData>(`/exchange?from=${from}&to=${to}&amount=${amount}`),

  posts: {
    list: (page = 1, tag?: string) =>
      apiFetch<PostsResponse>(`/posts?page=${page}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`),

    get: (slug: string) =>
      apiFetch<Post>(`/posts/${slug}`),

    create: (data: object, apiKey: string) =>
      apiFetch<{ id: number; slug: string }>('/posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(data),
      }),
  },

  health: () => apiFetch<{ status: string; timestamp: string }>('/health'),
}
