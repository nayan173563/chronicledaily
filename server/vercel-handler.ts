import app from './app';

export default function handler(req: any, res: any) {
  try {
    // If Vercel rewrote the request to /api, recover the original path
    const matchedPath =
      (req.headers?.['x-matched-path'] as string) ||
      (req.headers?.['x-invoke-path'] as string) ||
      (req.headers?.['x-forwarded-uri'] as string) ||
      (req.headers?.['x-original-url'] as string);

    if (matchedPath && (req.url === '/api' || req.url === '/api/' || req.url?.startsWith('/api?'))) {
      const queryIdx = req.url.indexOf('?');
      const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
      req.url = matchedPath + (query && !matchedPath.includes('?') ? query : '');
    } else if (req.query?.__path) {
      const subpath = Array.isArray(req.query.__path) ? req.query.__path.join('/') : req.query.__path;
      const queryIdx = req.url.indexOf('?');
      const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
      req.url = '/api/' + subpath.replace(/^\/+/, '') + query;
    }

    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Error]:', err);
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}
