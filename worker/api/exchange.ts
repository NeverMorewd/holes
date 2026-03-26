import { json } from '../lib/response';

export async function handleExchange(query: URLSearchParams): Promise<Response> {
  const from = query.get('from')?.toUpperCase();
  const to = query.get('to')?.toUpperCase();
  const amount = Number(query.get('amount') ?? '1');

  if (!from || !to) {
    return json({ message: 'Missing required params: from, to (e.g. ?from=CNY&to=USD)' }, 400);
  }

  const apiUrl = `https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`;
  let resp: Response;
  try {
    resp = await fetch(apiUrl);
  } catch {
    return json({ message: 'Exchange API request failed' }, 502);
  }

  if (!resp.ok) {
    return json({ message: 'Exchange API request failed', status: resp.status }, 502);
  }

  const data = (await resp.json()) as {
    result?: string;
    rates?: Record<string, number>;
    error_type?: string;
  };

  if (data.result !== 'success' || !data.rates) {
    return json({ message: 'Exchange API returned invalid data', detail: data.error_type }, 502);
  }

  if (!(to in data.rates)) {
    return json({ message: `Currency ${to} is not supported` }, 404);
  }

  const rate = data.rates[to];
  const converted = amount * rate;

  return json({ from, to, amount, rate, converted });
}
