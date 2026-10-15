/** JSON errors never include credentials, stack traces or record contents. */
export function apiError(status: number, code: string, message: string, requestId?: string): Response {
  return Response.json({ code, message, requestId }, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
