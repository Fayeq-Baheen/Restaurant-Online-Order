import app from '../server/index.js';

// Vercel routes /api/* to this function and strips the /api prefix.
// Restore it because the existing Express routes are defined as /api/... .
export default function handler(req, res) {
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
}
