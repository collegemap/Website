/**
 * scripts/generateSitemap.js
 * ---------------------------
 * Generates public/sitemap.xml with all static routes + 165+ programmatic
 * SEO college cutoff pages derived from Backend/data/josaaCutoffs.json.
 *
 * Run: node scripts/generateSitemap.js
 * Or:  npm run generate-sitemap
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://collegemap.in';

function getEnv(...names) {
  for (const name of names) {
    if (process.env[name]) {
      return process.env[name];
    }
  }
  return null;
}

// ─── Load cutoff data ─────────────────────────────────────────
const dataPath = path.join(__dirname, '..', 'Backend', 'data', 'josaaCutoffs.json');
const { entries } = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// ─── Slug helpers (mirrors collegeSlugUtils.js — plain JS, no imports) ────────
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** Shorten full institute name before slugifying so URLs are clean.
 *  "Indian Institute of Technology Bombay" → "IIT Bombay" → "iit-bombay"
 *  Must stay in sync with shortInstituteName() in collegeSlugUtils.js
 */
function shortInstituteName(fullName) {
  return fullName
    .replace('Indian Institute of Technology ', 'IIT ')
    .replace('National Institute of Technology ', 'NIT ')
    .replace('Indian Institute of Information Technology ', 'IIIT ');
}

// ─── Deduplicate institute + branch pairs ─────────────────────
const seen = new Set();
const pairs = [];

for (const entry of entries) {
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

console.log(`✅ Found ${pairs.length} unique institute+branch combinations`);

async function fetchPublishedBlogSlugs() {
  const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL', 'SUPABASE_URL', 'VITE_SUPABASE_URL');
  const supabaseKey = getEnv('REACT_APP_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase env vars not set; sitemap will include /blog but not individual blog posts.');
    return [];
  }

  const endpoint = new URL('/rest/v1/blogs', supabaseUrl);
  endpoint.searchParams.set('select', 'slug');
  endpoint.searchParams.set('published', 'eq.true');
  endpoint.searchParams.set('order', 'created_at.desc');

  const response = await fetch(endpoint, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch blog slugs: ${response.status} ${response.statusText}`);
  }

  const rows = await response.json();
  const slugs = rows
    .map((row) => row && row.slug)
    .filter((slug) => typeof slug === 'string' && slug.trim().length > 0);

  return [...new Set(slugs)];
}

// ─── Static routes ────────────────────────────────────────────
const staticRoutes = [
  { loc: '/',                        priority: '1.0', changefreq: 'weekly'  },
  { loc: '/CollegePredictor',        priority: '0.9', changefreq: 'monthly' },
  { loc: '/CollegePredictor/tool',   priority: '0.9', changefreq: 'monthly' },
  { loc: '/BranchComparision',       priority: '0.9', changefreq: 'monthly' },
  { loc: '/BranchComparision/tool',  priority: '0.9', changefreq: 'monthly' },
  { loc: '/College',                 priority: '0.8', changefreq: 'monthly' },
  { loc: '/TalkToIITians',           priority: '0.8', changefreq: 'weekly'  },
  { loc: '/StudyWithIITians',        priority: '0.8', changefreq: 'weekly'  },
  { loc: '/EnergyBatch',             priority: '0.8', changefreq: 'weekly'  },
  { loc: '/exams',                   priority: '0.8', changefreq: 'weekly'  },
  { loc: '/pyq',                     priority: '0.7', changefreq: 'monthly' },
  { loc: '/Resources',               priority: '0.7', changefreq: 'weekly'  },
  { loc: '/blog',                    priority: '0.6', changefreq: 'weekly'  },
  { loc: '/news',                    priority: '0.6', changefreq: 'daily'   },
  { loc: '/AboutUs',                 priority: '0.5', changefreq: 'monthly' },
  { loc: '/contact',                 priority: '0.5', changefreq: 'monthly' },
  { loc: '/team',                    priority: '0.4', changefreq: 'monthly' },
  { loc: '/HowItWorks',              priority: '0.4', changefreq: 'monthly' },
  { loc: '/Privacy-Policy',          priority: '0.3', changefreq: 'yearly'  },
  { loc: '/Terms-and-Conditions',    priority: '0.3', changefreq: 'yearly'  },
  { loc: '/refund',                  priority: '0.3', changefreq: 'yearly'  },
];

// ─── Build XML ────────────────────────────────────────────────
function urlEntry({ loc, priority, changefreq }) {
  return `
  <url>
    <loc>${BASE_URL}${loc}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
  </url>`;
}

const staticXml = staticRoutes.map(urlEntry).join('');

const programmaticXml = pairs.map(({ institute, branch }) => {
  const instSlug = toSlug(shortInstituteName(institute)); // ← short name → "iit-bombay"
  const branchSlug = toSlug(branch);
  return urlEntry({
    loc: `/colleges/${instSlug}/${branchSlug}/cutoff`,
    priority: '0.8',
    changefreq: 'yearly',
  });
}).join('');

async function buildSitemap() {
  const blogSlugs = await fetchPublishedBlogSlugs();
  const blogXml = blogSlugs.map((slug) => urlEntry({
    loc: `/blog/${slug}`,
    priority: '0.6',
    changefreq: 'monthly',
  })).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- ═══════════ Static Pages ═══════════ -->${staticXml}

  <!-- ═══════════ Programmatic SEO: College Cutoff Pages (${pairs.length} pages) ═══════════ -->${programmaticXml}

  <!-- ═══════════ Blog Posts (${blogSlugs.length} pages) ═══════════ -->${blogXml}
</urlset>
`;

  // ─── Write file ───────────────────────────────────────────────
  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf-8');

  console.log(`✅ Sitemap written to: ${outputPath}`);
  console.log(`   Static pages  : ${staticRoutes.length}`);
  console.log(`   Cutoff pages  : ${pairs.length}`);
  console.log(`   Blog pages    : ${blogSlugs.length}`);
  console.log(`   Total entries : ${staticRoutes.length + pairs.length + blogSlugs.length}`);
}

buildSitemap().catch((error) => {
  console.error('❌ Failed to generate sitemap:', error);
  process.exitCode = 1;
});
