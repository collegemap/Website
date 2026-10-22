/**
 * Single origin for the CollegeMap Express API (Vercel, VPS, etc.).
 *
 * REACT_APP_COLLEGEMAP_API_URL must be the server that serves /api/* — not the static React host.
 * If it is mistakenly set to collegemap.in (static only), we ignore it and fall back to the default API.
 */
const DEFAULT_PROD_API = 'https://backend-college-map.vercel.app';

const INVALID_API_HOSTS = new Set(['collegemap.in', 'www.collegemap.in']);

function stripTrailingSlash(u) {
  return String(u || '')
    .trim()
    .replace(/\/$/, '');
}

function hostnameOf(urlLike) {
  try {
    const s = urlLike.startsWith('http') ? urlLike : `https://${urlLike}`;
    return new URL(s).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isInvalidApiOrigin(urlLike) {
  const h = hostnameOf(urlLike);
  return Boolean(h && INVALID_API_HOSTS.has(h));
}

/**
 * Base URL for most `/api/*` calls (profile, bookings, NTA, resources, …).
 * Development: '' → same-origin `/api` via CRA proxy.
 */
export function getCollegemapApiBaseUrl() {
  const shared = stripTrailingSlash(process.env.REACT_APP_COLLEGEMAP_API_URL || '');
  if (shared && !isInvalidApiOrigin(shared)) return shared;
  if (process.env.NODE_ENV === 'development') return '';
  return DEFAULT_PROD_API;
}

/**
 * College Finder / branch-intel: optional dedicated override, else same as {@link getCollegemapApiBaseUrl}.
 */
export function getBranchIntelBaseUrl() {
  const explicit = stripTrailingSlash(process.env.REACT_APP_BRANCHINTEL_API_URL || '');
  if (explicit && !isInvalidApiOrigin(explicit)) return explicit;

  const shared = stripTrailingSlash(process.env.REACT_APP_COLLEGEMAP_API_URL || '');
  if (shared && !isInvalidApiOrigin(shared)) return shared;

  if (process.env.NODE_ENV === 'development') return '';
  return DEFAULT_PROD_API;
}

/** Absolute URL for an API path, e.g. collegemapApiUrl('/api/save-profile'). */
export function collegemapApiUrl(path) {
  const base = getCollegemapApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}
