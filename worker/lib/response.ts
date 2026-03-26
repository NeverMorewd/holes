export function json(data: unknown, status = 200): Response {
  const body = JSON.stringify({
    success: status < 400,
    data: status < 400 ? data : null,
    error: status >= 400 ? data : null,
    meta: { timestamp: new Date().toISOString(), version: '1' },
  });
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  });
}

export function cors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(response.body, { status: response.status, headers });
}

export function requireAuth(request: Request, apiKey?: string): boolean {
  if (!apiKey) return false;
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${apiKey}`;
}
