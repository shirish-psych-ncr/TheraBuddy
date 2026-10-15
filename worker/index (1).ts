import { handleApi, apiError } from './api';
import type { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) {
      const handled = await handleApi(request, env, path);
      if (handled) return handled;
      return apiError(404, 'NOT_FOUND', 'No clinical API is enabled in this demo.');
    }
    return apiError(404, 'NOT_FOUND', 'No clinical API is enabled in this demo.');
  }
};
