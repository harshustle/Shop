// Production is served behind the same Nginx origin, which proxies /api to the
// backend. Never bake a developer's localhost API URL into the live bundle.
export const API_URL = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL || '');


