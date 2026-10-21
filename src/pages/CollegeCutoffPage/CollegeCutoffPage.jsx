import React, { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ChevronRight,
  Award,
  Users,
  TrendingUp,
  BookOpen,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import {
  resolveFromSlugs,
  getCutoffEntries,
  shortInstituteName,
} from '../../utils/collegeSlugUtils';
import './CollegeCutoffPage.css';

/* ─── Helper: category → CSS class ─────────────────────────── */
function categoryClass(cat) {
  const c = cat.toUpperCase();
  if (c.includes('EWS')) return 'ews';
  if (c.includes('OBC')) return 'obc';
  if (c === 'SC') return 'sc';
  if (c === 'ST') return 'st';
  return 'open';
}

/* ─── Helper: summary stats from entries ───────────────────── */
function computeStats(entries) {
  if (!entries.length) return null;

  const openEntry = entries.find(
    (e) => e.quota === 'OPEN' && e.gender === 'Gender-Neutral'
  );

  const minOpening = Math.min(...entries.map((e) => e.openingRank));
  const maxClosing = Math.max(...entries.map((e) => e.closingRank));
  const totalCategories = new Set(entries.map((e) => e.quota)).size;

  return {
    openingRank: openEntry?.openingRank ?? minOpening,
    closingRank: openEntry?.closingRank ?? maxClosing,
    totalCategories,
    totalRows: entries.length,
  };
}

/* ─── Main Component ────────────────────────────────────────── */
export default function CollegeCutoffPage() {
  const { institute: instituteSlug, branch: branchSlug } = useParams();

  // Resolve slugs → display names
  const resolved = useMemo(
    () => resolveFromSlugs(instituteSlug, branchSlug),
    [instituteSlug, branchSlug]
  );

  // All cutoff entries for this institute + branch
  const allEntries = useMemo(() => {
    if (!resolved) return [];
    return getCutoffEntries(resolved.instituteName, resolved.branchName);
  }, [resolved]);

  // Filter state
  const [selectedQuota, setSelectedQuota] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  // Unique quota + gender options
  const quotas = useMemo(() => [...new Set(allEntries.map((e) => e.quota))].sort(), [allEntries]);
  const genders = useMemo(() => [...new Set(allEntries.map((e) => e.gender))].sort(), [allEntries]);

  // Filtered data
  const filteredEntries = useMemo(() => {
    return allEntries.filter((e) => {
      const quotaMatch = !selectedQuota || e.quota === selectedQuota;
      const genderMatch = !selectedGender || e.gender === selectedGender;
      return quotaMatch && genderMatch;
    });
  }, [allEntries, selectedQuota, selectedGender]);

  const stats = useMemo(() => computeStats(allEntries), [allEntries]);

  // ── Not found ────────────────────────────────────────────────
  if (!resolved || !allEntries.length) {
    return (
      <div className="ccp-root">
        <Helmet>
          <title>College Not Found | CollegeMap</title>
        </Helmet>
        <div className="ccp-not-found">
          <AlertCircle size={48} color="#475569" />
          <h1>Page Not Found</h1>
          <p>We couldn't find cutoff data for this college + branch combination.</p>
          <Link to="/College" className="ccp-btn-primary">
            <ArrowLeft size={16} /> Browse All Colleges
          </Link>
        </div>
      </div>
    );
  }

  const { instituteName, branchName } = resolved;
  const shortName = shortInstituteName(instituteName);
  // Detect institution type from first entry
  const institutionType = allEntries[0]?.institutionType ?? 'IIT';
  const typeClass = institutionType.toLowerCase();

  // SEO strings
  const pageTitle = `${shortName} ${branchName} Cutoff 2025 | Opening & Closing Ranks | CollegeMap`;
  const metaDescription = `${instituteName} ${branchName} JEE ${institutionType === 'IIT' ? 'Advanced' : 'Mains'
    } 2025 cutoff ranks — category-wise (OPEN, EWS, OBC-NCL, SC, ST) opening and closing ranks from JoSAA counselling. Use CollegeMap to predict colleges with your rank.`;
  const canonicalUrl = `https://collegemap.in/colleges/${instituteSlug}/${branchSlug}/cutoff`;

  return (
    <div className="ccp-root">
      {/* ── SEO Head ─────────────────────────────────────────── */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        {/* Structured data: FAQ-style rich snippet */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": `What is the ${shortName} ${branchName} cutoff 2025?`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `The ${shortName} ${branchName} cutoff 2025 lists OPEN, EWS, OBC-NCL, SC, and ST category ranks from JoSAA counselling. Check the full table on CollegeMap.`
              }
            },
            {
              "@type": "Question",
              "name": `What is the ${shortName} ${branchName} OBC cutoff 2025?`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `The ${shortName} ${branchName} OBC-NCL cutoff 2025 is available in the category-wise cutoff table on CollegeMap.`
              }
            }
          ]
        })}</script>
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="ccp-hero">
        <div className="ccp-hero-inner">

          {/* Breadcrumb */}
          <nav className="ccp-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <Link to="/College">Colleges</Link>
            <ChevronRight size={14} />
            <span>{shortName}</span>
            <ChevronRight size={14} />
            <span>{branchName}</span>
            <ChevronRight size={14} />
            <span>Cutoff 2025</span>
          </nav>

          {/* Badges */}
          <div className="ccp-badge-row">
            <span className={`ccp-type-badge ${typeClass}`}>
              <Award size={12} /> {institutionType}
            </span>
            <span className="ccp-year-badge">
              JEE 2025 Cutoffs
            </span>
          </div>

          {/* Title */}
          <h1 className="ccp-title">
            {shortName} — {branchName}
          </h1>
          <p className="ccp-subtitle">
            {instituteName} · JEE {institutionType === 'IIT' ? 'Advanced' : 'Mains'} 2025 Opening &amp; Closing Ranks
          </p>

          {/* Stat chips */}
          {stats && (
            <div className="ccp-stat-chips">
              <div className="ccp-chip">
                <span className="ccp-chip-label">OPEN Opening</span>
                <span className="ccp-chip-value highlight">{stats.openingRank.toLocaleString()}</span>
              </div>
              <div className="ccp-chip">
                <span className="ccp-chip-label">OPEN Closing</span>
                <span className="ccp-chip-value">{stats.closingRank.toLocaleString()}</span>
              </div>
              <div className="ccp-chip">
                <span className="ccp-chip-label">Categories</span>
                <span className="ccp-chip-value">{stats.totalCategories}</span>
              </div>
              <div className="ccp-chip">
                <span className="ccp-chip-label">Total Rows</span>
                <span className="ccp-chip-value">{stats.totalRows}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="ccp-main">

        {/* ── Cutoff Table Section ─────────────────────────── */}
        <div className="ccp-section-header">
          <div className="ccp-section-title">
            <div className="ccp-section-icon">
              <TrendingUp size={18} />
            </div>
            Opening &amp; Closing Ranks — 2025
          </div>
        </div>

        {/* Filters */}
        <div className="ccp-filters">
          <div className="ccp-filter-group">
            <label className="ccp-filter-label">Category (Quota)</label>
            <select
              className="ccp-filter-select"
              value={selectedQuota}
              onChange={(e) => setSelectedQuota(e.target.value)}
            >
              <option value="">All Categories</option>
              {quotas.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          <div className="ccp-filter-group">
            <label className="ccp-filter-label">Gender</label>
            <select
              className="ccp-filter-select"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              <option value="">All Genders</option>
              {genders.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {(selectedQuota || selectedGender) && (
            <button
              className="ccp-clear-btn"
              onClick={() => { setSelectedQuota(''); setSelectedGender(''); }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="ccp-table-card">
          <div className="ccp-table-scroll">
            <table className="ccp-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Gender</th>
                  <th className="ccp-th-right">Opening Rank</th>
                  <th className="ccp-th-right">Closing Rank</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length > 0 ? filteredEntries.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className={`ccp-cat-badge ${categoryClass(row.quota)}`}>
                        {row.quota}
                      </span>
                    </td>
                    <td>
                      <span className="ccp-gender-pill">
                        <Users size={13} />
                        {row.gender}
                      </span>
                    </td>
                    <td className="ccp-td-rank opening">
                      {row.openingRank.toLocaleString()}
                    </td>
                    <td className="ccp-td-rank closing">
                      {row.closingRank.toLocaleString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="ccp-no-data">
                      No records match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SEO Content Block ─────────────────────────────── */}
        <div className="ccp-info-block">
          <h2>About {shortName} {branchName} Cutoffs 2025</h2>
          <p>
            The <strong>{instituteName} {branchName}</strong> JEE {institutionType === 'IIT' ? 'Advanced' : 'Mains'} 2025
            cutoff ranks are the minimum and maximum ranks at which seats were allotted through JoSAA counselling.
          </p>
          <p>
            Cutoff ranks vary by category (OPEN, EWS, OBC-NCL, SC, ST) and gender (Gender-Neutral, Female-only).
            Use the filters above to check the exact cutoff for your category.
            A lower closing rank means the branch is more competitive.
          </p>
          <p>
            Want to know which {institutionType} you can get based on your rank?
            Use CollegeMap's <strong>College Predictor tool</strong> — it matches your JEE rank
            across all {institutionType === 'IIT' ? '23 IITs' : '31 NITs'} and hundreds of branches instantly.
          </p>
        </div>

        {/* ── CTA Block ─────────────────────────────────────── */}
        <div className="ccp-cta-block">
          <div className="ccp-cta-text">
            <h3>Find all colleges you can get with your rank</h3>
            <p>Enter your JEE rank and CollegeMap predicts your best college + branch options</p>
          </div>
          <div className="ccp-cta-buttons">
            <Link to="/CollegePredictor/tool" className="ccp-btn-primary">
              <TrendingUp size={15} /> Use College Predictor
            </Link>
            <Link to="/College" className="ccp-btn-secondary">
              <BookOpen size={15} /> Browse Colleges
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
