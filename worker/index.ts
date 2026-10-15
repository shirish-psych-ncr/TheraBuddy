interface Env { DB: { prepare(sql: string): { first(): Promise<unknown> } } }
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (path === '/api/v1/health' && request.method === 'GET') {
      try {
        await env.DB.prepare('SELECT version FROM schema_info LIMIT 1').first();
        return Response.json({ status: 'ok', mode: 'offline-synthetic-demo', clinicalApi: false }, { headers });
      } catch { return Response.json({ status: 'unavailable', code: 'LOCAL_DATABASE_NOT_READY' }, { status: 503, headers }); }
    }
    return Response.json({ code: 'NOT_FOUND', message: 'No clinical API is enabled in this demo.' }, { status: 404, headers });
  }
};
