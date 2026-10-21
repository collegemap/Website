'use strict';

const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { randomUUID } = require('crypto');
const { buildMasterPrompt } = require('./branchIntelMasterPrompt');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent';

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const INSTITUTION_CATALOG_PATH = path.join(__dirname, 'data', 'institutionBranchCatalog.json');
const IIT_FALLBACK_PATH = path.join(__dirname, 'data', 'iitBranchCatalog.json');

const TYPES = ['IIT', 'NIT', 'IIIT', 'Private'];
const PRIVATE_SOURCE_TYPES = ['BITS', 'VIT', 'SRM', 'Amrita', 'Other top colleges'];

/** @type {Record<string, Record<string, string[]>>} */
let byType = { IIT: {}, NIT: {}, IIIT: {}, Private: {} };

function mergePrivateSources(sources) {
  const merged = {};
  for (const t of PRIVATE_SOURCE_TYPES) {
    const m = sources[t] || {};
    for (const [college, branches] of Object.entries(m)) {
      if (Array.isArray(branches) && branches.length) merged[college] = branches;
    }
  }
  return merged;
}

function loadBranchCatalogs() {
  try {
    const raw = JSON.parse(fs.readFileSync(INSTITUTION_CATALOG_PATH, 'utf8'));
    byType.IIT = raw.IIT?.branchesByCollege || {};
    byType.NIT = raw.NIT?.branchesByCollege || {};
    byType.IIIT = raw.IIIT?.branchesByCollege || {};
    const privateSources = {};
    for (const t of PRIVATE_SOURCE_TYPES) {
      privateSources[t] = raw[t]?.branchesByCollege || {};
    }
    byType.Private = mergePrivateSources(privateSources);
    if (raw.Private?.branchesByCollege && Object.keys(raw.Private.branchesByCollege).length) {
      Object.assign(byType.Private, raw.Private.branchesByCollege);
    }

    if (Object.keys(byType.IIT).length > 0) {
      return;
    }
  } catch (e) {
    console.warn('[branch-intel] institutionBranchCatalog.json:', e.message);
  }
  try {
    const raw = JSON.parse(fs.readFileSync(IIT_FALLBACK_PATH, 'utf8'));
    byType.IIT = raw.branchesByCollege || {};
    byType.NIT = {};
    byType.IIIT = {};
    byType.Private = {};
  } catch (e) {
    console.error('[branch-intel] Missing IIT catalog fallback:', e.message);
    byType = { IIT: {}, NIT: {}, IIIT: {}, Private: {} };
  }
}

loadBranchCatalogs();

function resolveInstitutionType(type) {
  const upper = String(type || 'IIT').toUpperCase();
  const direct = TYPES.find((x) => x.toUpperCase() === upper);
  if (direct) return direct;
  const legacyPrivate = PRIVATE_SOURCE_TYPES.find((x) => x.toUpperCase() === upper);
  if (legacyPrivate) return 'Private';
  return null;
}

function collegesForType(t) {
  const m = byType[t] || {};
  return Object.keys(m).sort();
}

function branchesForCollege(type, college) {
  const list = byType[type]?.[college];
  return Array.isArray(list) ? list : [];
}

function isValidTriple(type, college, branch) {
  if (!TYPES.includes(type)) return false;
  const list = byType[type]?.[college];
  return Array.isArray(list) && list.includes(branch);
}

function buildCatalogPayload() {
  const out = { types: [...TYPES], byType: {} };
  for (const t of TYPES) {
    const m = byType[t] || {};
    out.byType[t] = {
      colleges: Object.keys(m).sort(),
      branchesByCollege: m,
    };
  }
  return out;
}

function catalogLoaded() {
  return TYPES.some((t) => Object.keys(byType[t] || {}).length > 0);
}

/** @deprecated IIT-only list; use collegesForType('IIT') */
const COLLEGE_LIST = collegesForType('IIT');
const branchesByCollege = byType.IIT || {};

function cleanJson(raw) {
  return String(raw)
    .replace(/```(?:json)?/gi, '')
    .trim()
    .replace(/`+$/g, '')
    .trim();
}

async function callAnyGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to Backend/.env (same key as branchintel 9) and restart the server.'
    );
  }
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" },
  };

  for (const model of MODELS) {
    const url = `${GEMINI_BASE.replace('{model}', model)}?key=${GEMINI_API_KEY}`;
    try {
      const res = await axios.post(url, payload, { timeout: 120000 });
      if (res.status === 200) {
        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && String(text).trim()) {
          console.log(`[branch-intel] Gemini OK: ${model}`);
          return text;
        }
      } else {
        console.warn(`[branch-intel] ${model} status ${res.status}`);
      }
    } catch (e) {
      const st = e.response?.status;
      if (st === 429) {
        console.warn(`[branch-intel] ${model} rate-limited, next model…`);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      console.warn(`[branch-intel] ${model} error:`, e.message);
    }
  }
  throw new Error(
    'All Gemini models failed (quota, model IDs, or network). Check GEMINI_API_KEY and https://aistudio.google.com/'
  );
}

function parseJsonFromModel(raw) {
  const cleaned = cleanJson(raw);
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        throw e1;
      }
    }
    throw e1;
  }
}

const PREFIX = '/api/branch-intel';

function registerBranchIntelRoutes(app) {
  app.get(`${PREFIX}/health`, (req, res) => {
    res.json({
      status: 'ok',
      service: 'BranchIntel',
      engine: 'nodejs',
      geminiConfigured: !!GEMINI_API_KEY,
    });
  });

  app.get(`${PREFIX}/catalog`, (req, res) => {
    const payload = buildCatalogPayload();
    res.json(payload);
  });

  app.get(`${PREFIX}/colleges`, (req, res) => {
    const t = resolveInstitutionType(req.query.type || 'IIT');
    if (t) {
      return res.json({ type: t, colleges: collegesForType(t) });
    }
    return res.status(400).json({ detail: 'Invalid institution type.' });
  });

  app.get(`${PREFIX}/branches`, (req, res) => {
    const t = resolveInstitutionType(req.query.type || 'IIT');
    const college = req.query.college || req.query.iit;
    if (college && t) {
      return res.json({ type: t, college: String(college), branches: branchesForCollege(t, String(college)) });
    }
    const legacyIit = req.query.iit;
    if (legacyIit) {
      return res.json({ branches: branchesForCollege('IIT', String(legacyIit)) });
    }
    const all = new Set();
    for (const t2 of TYPES) {
      Object.values(byType[t2] || {}).forEach((arr) => {
        arr.forEach((b) => all.add(b));
      });
    }
    res.json({ branches: [...all].sort() });
  });

  app.post(`${PREFIX}/compare`, async (req, res) => {
    const requestId = randomUUID();
    const start = Date.now();
    const body = req.body || {};
    const {
      institutionType1,
      institutionType2,
      type1: bodyType1,
      type2: bodyType2,
      college1,
      college2,
      iit1,
      iit2,
      branch1,
      branch2,
      user_query: userQuery,
    } = body;

    const t1Upper = String(institutionType1 || bodyType1 || 'IIT').toUpperCase();
    const t2Upper = String(institutionType2 || bodyType2 || 'IIT').toUpperCase();
    const t1 = resolveInstitutionType(t1Upper);
    const t2 = resolveInstitutionType(t2Upper);
    const c1 = String(college1 || iit1 || '').trim();
    const c2 = String(college2 || iit2 || '').trim();

    if (!c1 || !branch1 || !c2 || !branch2) {
      return res.status(400).json({
        detail:
          'Missing college or branch. Send institutionType1, college1, branch1, institutionType2, college2, branch2 (or legacy iit1/iit2).',
      });
    }

    if (!t1 || !t2) {
      return res.status(400).json({ detail: 'Invalid institutionType. Must be one of: ' + TYPES.join(', ') });
    }

    if (!catalogLoaded()) {
      return res.status(503).json({ detail: 'Branch catalog not loaded on server.' });
    }
    if (!isValidTriple(t1, c1, branch1) || !isValidTriple(t2, c2, branch2)) {
      return res.status(400).json({
        detail:
          'Branch does not match the selected college for that institution type. Refresh and pick from the lists.',
      });
    }

    const b1 = `${branch1} / ${c1} (${t1})`;
    const b2 = `${branch2} / ${c2} (${t2})`;
    const uq = userQuery && String(userQuery).trim() ? String(userQuery).trim() : null;

    console.log(`[branch-intel] ${requestId} compare ${b1} vs ${b2}`);

    try {
      const prompt = buildMasterPrompt(b1, b2, uq);
      const raw = await callAnyGemini(prompt);
      const data = parseJsonFromModel(raw);

      if (!data.stage1 || !data.stage2 || !data.stage3) {
        return res.status(500).json({ detail: 'Model response missing stage1/stage2/stage3.' });
      }

      const elapsed = Math.round((Date.now() - start) / 100) / 10;
      console.log(`[branch-intel] ${requestId} done in ${elapsed}s`);

      return res.json({
        request_id: requestId,
        institutionType1: t1,
        institutionType2: t2,
        college1: c1,
        college2: c2,
        branch1,
        branch2,
        iit1: c1,
        iit2: c2,
        user_query: uq,
        stage1: data.stage1,
        stage2: data.stage2,
        stage3: data.stage3,
        total_agents_used: 10,
        feedback_loops_triggered: 0,
        processing_time_seconds: elapsed,
      });
    } catch (err) {
      console.error(`[branch-intel] ${requestId}`, err);
      return res.status(500).json({ detail: err.message || 'Comparison failed.' });
    }
  });
}

module.exports = {
  registerBranchIntelRoutes,
  COLLEGE_LIST,
  branchesByCollege,
  PREFIX,
  TYPES,
  byType,
};
