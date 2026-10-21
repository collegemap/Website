import { branchMatchesPresets } from './branchPresets';

/** Hard cap on number of programmes returned. */
export const MAX_PREDICTOR_RESULTS = 75;

export const CATEGORY_OPTIONS = [
  { value: 'OPEN', label: 'OPEN' },
  { value: 'EWS', label: 'EWS' },
  { value: 'OBC-NCL', label: 'OBC-NCL' },
  { value: 'SC', label: 'SC' },
  { value: 'ST', label: 'ST' },
  { value: 'OPEN (PwD)', label: 'OPEN (PwD)' },
  { value: 'EWS (PwD)', label: 'EWS (PwD)' },
  { value: 'OBC-NCL (PwD)', label: 'OBC-NCL (PwD)' },
  { value: 'SC (PwD)', label: 'SC (PwD)' },
  { value: 'ST (PwD)', label: 'ST (PwD)' },
];

/** Derive base category + PwD flag from dropdown value (supports legacy pwd boolean). */
export function resolveCategoryFilters(category, pwd = false) {
  const raw = String(category || 'OPEN');
  const isPwd = pwd || raw.includes('(PwD)');
  const baseCategory = isPwd ? raw.replace(' (PwD)', '') : raw;
  return { category: baseCategory, pwd: isPwd, quota: isPwd ? `${baseCategory} (PwD)` : baseCategory };
}

const normalSeatTypes = new Set([
  'OPEN', 'EWS', 'OBC-NCL', 'SC', 'ST', 'OBC-NCL (PwD)', 'OPEN (PwD)', 'EWS (PwD)', 'SC (PwD)', 'ST (PwD)'
]);

function cleanSeatType(str) {
  if (!str) return 'OPEN';
  if (normalSeatTypes.has(str)) return str;
  const caps = str.replace(/[^A-Z]/g, '');
  let base = 'OPEN';
  if (/O.*B.*C/.test(caps)) base = 'OBC-NCL';
  else if (/E.*W.*S/.test(caps)) base = 'EWS';
  else if (/O.*P.*E.*N/.test(caps)) base = 'OPEN';
  else if (/S.*C/.test(caps)) base = 'SC';
  else if (/S.*T/.test(caps)) base = 'ST';
  
  const isPwd = /P.*W.*D/i.test(str) || str.includes('PwD');
  return isPwd ? `${base} (PwD)` : base;
}

function cleanQuota(str) {
  if (!str) return 'AI';
  const normalQuotas = new Set(['AI', 'HS', 'OS', 'GO', 'JK', 'LA']);
  if (normalQuotas.has(str)) return str;
  const caps = str.replace(/[^A-Z]/g, '');
  if (/A.*I/.test(caps)) return 'AI';
  if (/H.*S/.test(caps)) return 'HS';
  if (/O.*S/.test(caps)) return 'OS';
  if (/G.*O/.test(caps)) return 'GO';
  if (/J.*K/.test(caps)) return 'JK';
  if (/L.*A/.test(caps)) return 'LA';
  return 'AI';
}

export function matchesEntry(entry, filters) {
  const { exam, genderFemale, seatPool, institutionTypes } = filters;
  const { quota } = resolveCategoryFilters(filters.category, filters.pwd);
  if (!entry || entry.exam !== exam) return false;

  if (institutionTypes?.length) {
    if (!institutionTypes.includes(entry.institutionType)) return false;
  } else if (exam === 'JEE_ADVANCED' && entry.institutionType !== 'IIT') return false;
  else if (exam === 'JEE_MAINS' && !['NIT', 'IIIT'].includes(entry.institutionType)) return false;

  if (genderFemale) {
    if (!String(entry.gender || '').includes('Female-only')) return false;
  } else {
    const g = String(entry.gender || '');
    if (g.includes('Female-only')) return false;
    if (!g.includes('Gender-Neutral')) return false;
  }

  const cleanedSeatType = cleanSeatType(entry.seatType);

  if (cleanedSeatType !== quota) return false;

  if (exam === 'JEE_ADVANCED') {
    return true;
  }

  // JEE_MAINS
  const entryQuota = cleanQuota(entry.quota);
  if (seatPool === 'HOME_STATE') {
    return entryQuota === 'HS';
  }
  
  return entryQuota === 'AI' || entryQuota === 'OS';
}

/**
 * @param {object[]} entries
 * @param {object} filters — matchesEntry fields + rank, maxResults, preferredBranchIds (preset ids)
 */
export function predictCutoffs(entries, filters) {
  const rank = Number(filters.rank);
  if (!Number.isFinite(rank) || rank < 1) return [];

  const max = Math.min(
    Number(filters.maxResults) > 0 ? Number(filters.maxResults) : MAX_PREDICTOR_RESULTS,
    MAX_PREDICTOR_RESULTS
  );

  const preferredBranchIds = filters.preferredBranchIds || [];

  const out = [];
  for (const e of entries) {
    if (!matchesEntry(e, filters)) continue;
    if (preferredBranchIds.length && !branchMatchesPresets(e.branch, preferredBranchIds)) continue;
    
    let maxCrStr = e.predictions?.lessLikely?.closingRank;
    if (!maxCrStr || maxCrStr === '#VALUE!') maxCrStr = e.predictions?.Likely?.closingRank;
    if (!maxCrStr || maxCrStr === '#VALUE!') maxCrStr = e.predictions?.veryLikely?.closingRank;
    if (!maxCrStr || maxCrStr === '#VALUE!') maxCrStr = e.predictions?.mostLikely?.closingRank;
    
    const maxCr = parseInt(maxCrStr, 10);
    if (!Number.isFinite(maxCr) || rank > maxCr) continue;
    
    let likelihood = 'Less Likely';
    let likelihoodWeight = 4;
    let crStr = e.predictions?.lessLikely?.closingRank;
    let orStr = e.predictions?.lessLikely?.openingRank;

    if (rank <= parseInt(e.predictions?.mostLikely?.closingRank, 10)) {
        likelihood = 'Most Likely';
        likelihoodWeight = 1;
        crStr = e.predictions?.mostLikely?.closingRank;
        orStr = e.predictions?.mostLikely?.openingRank;
    } else if (rank <= parseInt(e.predictions?.veryLikely?.closingRank, 10)) {
        likelihood = 'Very Likely';
        likelihoodWeight = 2;
        crStr = e.predictions?.veryLikely?.closingRank;
        orStr = e.predictions?.veryLikely?.openingRank;
    } else if (rank <= parseInt(e.predictions?.Likely?.closingRank, 10)) {
        likelihood = 'Likely';
        likelihoodWeight = 3;
        crStr = e.predictions?.Likely?.closingRank;
        orStr = e.predictions?.Likely?.openingRank;
    }

    const cr = parseInt(crStr, 10);
    const or = parseInt(orStr, 10) || null;

    out.push({
      ...e,
      closingRank: cr,
      openingRank: or,
      likelihood,
      likelihoodWeight,
      _sort: Math.abs(cr - rank),
    });
  }

  out.sort((a, b) => a.likelihoodWeight - b.likelihoodWeight || a._sort - b._sort || a.closingRank - b.closingRank);
  return out.slice(0, max).map(({ _sort, likelihoodWeight, ...row }) => row);
}
