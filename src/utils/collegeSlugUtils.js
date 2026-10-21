/**
 * collegeSlugUtils.js
 * -------------------
 * Converts college/branch display names ↔ URL-safe slugs.
 * Builds the full programmatic SEO route catalog from josaaCutoffs.json.
 *
 * Used by:
 *   - CollegeCutoffPage.jsx  (reads slug params → looks up real names)
 *   - scripts/generateSitemap.js (generates all /colleges/.../cutoff URLs)
 *
 * NOTE: josaaCutoffs.json (1.3 MB) is imported here but CollegeCutoffPage is
 * loaded via React.lazy in App.js, so this chunk is ONLY downloaded by users
 * who actually visit a /colleges/... URL — never by the main bundle.
 */

import cutoffData from '../data/josaaCutoffs.json';


/**
 * Convert any string to a URL-safe slug.
 * e.g. "IIT Bombay" → "iit-bombay"
 *      "Computer Science & Engineering" → "computer-science-and-engineering"
 */
export function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars except hyphen
    .trim()
    .replace(/\s+/g, '-');        // spaces → hyphens
}

/**
 * Returns deduplicated list of { institute, branch, institutionType } objects
 * derived from josaaCutoffs.json entries.
 */
export function getAllCollegeBranchPairs() {
  const seen = new Set();
  const pairs = [];

  for (const entry of cutoffData.entries) {
    const key = `${entry.institute}|||${entry.branch}`;
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push({
        institute: entry.institute,
        branch: entry.branch,
        institutionType: entry.institutionType,
      });
    }
  }

  // Sort: IITs first, then alphabetical by institute → branch
  pairs.sort((a, b) => {
    if (a.institutionType !== b.institutionType) {
      const order = { IIT: 0, NIT: 1, IIIT: 2 };
      return (order[a.institutionType] ?? 3) - (order[b.institutionType] ?? 3);
    }
    if (a.institute !== b.institute) return a.institute.localeCompare(b.institute);
    return a.branch.localeCompare(b.branch);
  });

  return pairs;
}

/**
 * Build a lookup map: instituteSlug → canonicalDisplayName
 * and branchSlug (per institute) → canonicalDisplayName
 * Used by CollegeCutoffPage to reverse-map URL params → display names.
 *
 * IMPORTANT: institute slug is derived from the SHORT name ("IIT Bombay")
 * not the full name ("Indian Institute of Technology Bombay"), so URLs
 * are clean: /colleges/iit-bombay/... instead of
 * /colleges/indian-institute-of-technology-bombay/...
 */
export function buildSlugLookup() {
  const pairs = getAllCollegeBranchPairs();

  /** Map: instituteSlug → { displayName, branches: { branchSlug → displayName } } */
  const lookup = {};

  for (const { institute, branch } of pairs) {
    const instSlug = toSlug(shortInstituteName(institute)); // ← short name first
    const branchSlug = toSlug(branch);

    if (!lookup[instSlug]) {
      lookup[instSlug] = { displayName: institute, branches: {} };
    }
    lookup[instSlug].branches[branchSlug] = branch;
  }

  return lookup;
}

/**
 * Given URL params (instituteSlug, branchSlug), returns display names.
 * Returns null if not found.
 */
export function resolveFromSlugs(instituteSlug, branchSlug) {
  const lookup = buildSlugLookup();
  const instEntry = lookup[instituteSlug];
  if (!instEntry) return null;

  const branchName = instEntry.branches[branchSlug];
  if (!branchName) return null;

  return {
    instituteName: instEntry.displayName,
    branchName,
  };
}

/**
 * Get all cutoff entries for a given institute + branch (display names).
 */
export function getCutoffEntries(instituteName, branchName) {
  return cutoffData.entries.filter(
    (e) => e.institute === instituteName && e.branch === branchName
  );
}

/**
 * Short display name for SEO titles — strips "Indian Institute of Technology" etc.
 * e.g. "Indian Institute of Technology Bombay" → "IIT Bombay"
 */
export function shortInstituteName(fullName) {
  return fullName
    .replace('Indian Institute of Technology ', 'IIT ')
    .replace('National Institute of Technology ', 'NIT ')
    .replace('Indian Institute of Information Technology ', 'IIIT ');
}
