/**
 * BranchIntel — College Finder API client.
 *
 * Endpoints (on CollegeMap Express — Backend/server.js):
 *   GET  /api/branch-intel/catalog   — { types, byType: { IIT|NIT|IIIT: { colleges, branchesByCollege } } }
 *   GET  /api/branch-intel/colleges  — ?type=IIT|NIT|IIIT
 *   GET  /api/branch-intel/branches  — ?type=...&college=... (or legacy ?iit= for IIT)
 *   POST /api/branch-intel/compare
 *
 * Development (`npm start`): CRA proxy → localhost:4000, so base URL is empty (same-origin).
 *
 * Production: a static export (e.g. collegemap.in) cannot run /api — we must call the real
 * Node server. Set REACT_APP_BRANCHINTEL_API_URL or REACT_APP_COLLEGEMAP_API_URL, or rely on
 * the default below (same deployment as save-profile / seminar APIs).
 */
import { getBranchIntelBaseUrl } from '../collegemapApiOrigin';

const BRANCH_INTEL_PREFIX = '/api/branch-intel';

export { getBranchIntelBaseUrl };

function pathWithPrefix(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BRANCH_INTEL_PREFIX}${p}`;
}

function url(path) {
  const base = getBranchIntelBaseUrl();
  const full = pathWithPrefix(path);
  return base ? `${base}${full}` : full;
}

function isProbablyHtml(text) {
  const t = String(text).trimStart();
  return t.startsWith('<') || t.toLowerCase().startsWith('<!doctype');
}

async function readJsonResponse(res) {
  const text = await res.text();
  if (isProbablyHtml(text)) {
    throw new Error(
      'College Finder could not load data (this page is static and has no /api). ' +
        'Set REACT_APP_BRANCHINTEL_API_URL or REACT_APP_COLLEGEMAP_API_URL to your Express backend URL, rebuild, ' +
        'and ensure that server is deployed with the latest Backend/server.js (includes /api/branch-intel/*).'
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('College Finder service returned data that could not be read.');
  }
}

function errorFromJson(data, fallback) {
  const detail = data && data.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((x) => x.msg || JSON.stringify(x)).join('; ') || fallback;
  }
  if (detail) return JSON.stringify(detail);
  return (data && data.message) || fallback;
}

export async function fetchColleges(type = 'IIT') {
  const q = new URLSearchParams({ type: String(type || 'IIT').toUpperCase() });
  const res = await fetch(`${url('/colleges')}?${q}`);
  const data = await readJsonResponse(res);
  if (!res.ok) {
    throw new Error(errorFromJson(data, 'Could not load college list.'));
  }
  return data.colleges || [];
}

/**
 * @returns {Promise<{ types: string[], byType: Record<string, { colleges: string[], branchesByCollege: Record<string, string[]> }> }>}
 */
export async function fetchBranchCatalog() {
  const res = await fetch(url('/catalog'));
  const data = await readJsonResponse(res);
  if (!res.ok) {
    throw new Error(errorFromJson(data, 'Could not load institution/branch catalog.'));
  }
  const types = data.types || ['IIT', 'NIT', 'IIIT'];
  const byType = data.byType || {};
  return { types, byType };
}

export async function fetchBranches() {
  const res = await fetch(url('/branches'));
  const data = await readJsonResponse(res);
  if (!res.ok) {
    throw new Error(errorFromJson(data, 'Could not load branch list.'));
  }
  return data.branches || [];
}

/**
 * @param {{
 *   institutionType1: string, college1: string, branch1: string,
 *   institutionType2: string, college2: string, branch2: string,
 *   user_query?: string
 * }} payload
 */
export async function compareBranches(payload) {
  const res = await fetch(url('/compare'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (isProbablyHtml(text)) {
    throw new Error(
      'College Finder API is not reachable. Use REACT_APP_COLLEGEMAP_API_URL or REACT_APP_BRANCHINTEL_API_URL, ' +
        'rebuild, and redeploy Backend with BranchIntel routes + GEMINI_API_KEY.'
    );
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text.slice(0, 120) || 'Invalid response from comparison service.');
  }
  if (!res.ok) {
    throw new Error(errorFromJson(data, res.statusText || 'Comparison failed.'));
  }
  return data;
}
