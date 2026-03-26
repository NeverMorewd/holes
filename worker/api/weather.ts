import { json } from '../lib/response';

interface GeoResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  admin1?: string;
}

export async function handleWeather(query: URLSearchParams): Promise<Response> {
  const city = query.get('city');
  if (!city) {
    return json({ message: 'Missing required param: city (e.g. ?city=Beijing)' }, 400);
  }

  const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
  geoUrl.searchParams.set('name', city);
  geoUrl.searchParams.set('count', '1');
  geoUrl.searchParams.set('language', 'en');

  let geoResp: Response;
  try {
    geoResp = await fetch(geoUrl.toString());
  } catch {
    return json({ message: 'Geocoding API request failed' }, 502);
  }

  if (!geoResp.ok) {
    return json({ message: 'Geocoding API request failed', status: geoResp.status }, 502);
  }

  const geoData = (await geoResp.json()) as { results?: GeoResult[] };
  if (!geoData.results || geoData.results.length === 0) {
    return json({ message: `City not found: ${city}` }, 404);
  }

  const { latitude, longitude, name, country, admin1 } = geoData.results[0];

  const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
  weatherUrl.searchParams.set('latitude', latitude.toString());
  weatherUrl.searchParams.set('longitude', longitude.toString());
  weatherUrl.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode');
  weatherUrl.searchParams.set('current_weather', 'true');
  weatherUrl.searchParams.set('timezone', 'auto');
  weatherUrl.searchParams.set('forecast_days', '7');

  let weatherResp: Response;
  try {
    weatherResp = await fetch(weatherUrl.toString());
  } catch {
    return json({ message: 'Weather API request failed' }, 502);
  }

  if (!weatherResp.ok) {
    return json({ message: 'Weather API request failed', status: weatherResp.status }, 502);
  }

  const weatherData = await weatherResp.json();

  return json({
    city: name,
    region: admin1,
    country,
    location: { latitude, longitude },
    weather: weatherData,
  });
}
