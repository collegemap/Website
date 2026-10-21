import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './CollegePredictorResults.scss';
import { BRANCH_PRESETS } from './branchPresets';
import { MAX_PREDICTOR_RESULTS, resolveCategoryFilters } from './predictorFilter';
import { sanitizePredictorLine } from './displaySanitize';

const STORAGE_KEY = 'college_predictor_last';

function loadPayload() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function typeStyle(t) {
  if (t === 'IIT') return 'cpr-type--iit';
  if (t === 'NIT') return 'cpr-type--nit';
  return 'cpr-type--iiit';
}

function getBadgeClass(likelihood) {
  switch (likelihood) {
    case 'Most Likely': return 'cpr-card-badge--most-likely';
    case 'Very Likely': return 'cpr-card-badge--very-likely';
    case 'Likely': return 'cpr-card-badge--likely';
    case 'Less Likely': return 'cpr-card-badge--less-likely';
    default: return 'cpr-card-badge--likely';
  }
}

export default function CollegePredictorResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [payload, setPayload] = useState(
    () => location.state?.predictorPayload ?? loadPayload()
  );

  useEffect(() => {
    const fromNav = location.state?.predictorPayload;
    if (fromNav?.results) {
      setPayload(fromNav);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromNav));
      } catch {
        /* ignore */
      }
    }
  }, [location.state]);

  const [typeFilter, setTypeFilter] = useState('ALL');

  const filtered = useMemo(() => {
    const rows = payload?.results || [];
    if (typeFilter === 'ALL') return rows;
    return rows.filter((r) => r.institutionType === typeFilter);
  }, [payload, typeFilter]);

  const counts = useMemo(() => {
    const rows = payload?.results || [];
    return {
      all: rows.length,
      IIT: rows.filter((r) => r.institutionType === 'IIT').length,
      NIT: rows.filter((r) => r.institutionType === 'NIT').length,
      IIIT: rows.filter((r) => r.institutionType === 'IIIT').length,
    };
  }, [payload]);

  if (!payload) {
    return (
      <div className="cpr-page">
        <div className="cpr-empty">
          <p>No prediction yet.</p>
          <Link to="/CollegePredictor" className="cpr-btn-primary">
            Go to predictor
          </Link>
        </div>
      </div>
    );
  }

  const { rank, exam, category, genderFemale, seatPool, mainInstitutions, preferredBranchIds = [] } =
    payload;
  const { pwd } = resolveCategoryFilters(category, payload.pwd);
  const examLabel = exam === 'JEE_ADVANCED' ? 'JEE Advanced' : 'JEE Main';
  const poolLabel =
    exam === 'JEE_MAINS' ? (seatPool === 'HOME_STATE' ? 'Home state' : 'All India') : null;

  const mainInstLabel =
    exam === 'JEE_MAINS' && mainInstitutions
      ? mainInstitutions === 'BOTH'
        ? 'NIT & IIIT'
        : mainInstitutions === 'NIT'
          ? 'NIT only'
          : 'IIIT only'
      : null;

  const branchPillLabels = preferredBranchIds
    .map((id) => BRANCH_PRESETS.find((p) => p.id === id)?.label)
    .filter(Boolean);

  return (
    <div className="cpr-page">
      <div className="cpr-shell">
        <button type="button" className="cpr-back" onClick={() => navigate('/CollegePredictor/tool')}>
          ← Edit inputs
        </button>

        <header className="cpr-hero">
          <div className="cpr-hero-rank">
            <span className="cpr-hero-label">Your rank</span>
            <span className="cpr-hero-num">{Number(rank).toLocaleString()}</span>
          </div>
          <div className="cpr-hero-meta">
            <span className="cpr-pill">{examLabel}</span>
            <span className="cpr-pill">{category}</span>
            <span className="cpr-pill">{genderFemale ? 'Female' : 'Neutral'}</span>
            {pwd && !String(category).includes('(PwD)') ? <span className="cpr-pill">PwD</span> : null}
            {poolLabel ? <span className="cpr-pill">{poolLabel}</span> : null}
            {mainInstLabel ? <span className="cpr-pill">{mainInstLabel}</span> : null}
            {branchPillLabels.slice(0, 4).map((t) => (
              <span key={t} className="cpr-pill cpr-pill--branch" title={branchPillLabels.join(', ')}>
                {t.length > 28 ? `${t.slice(0, 26)}…` : t}
              </span>
            ))}
            {branchPillLabels.length > 4 ? (
              <span className="cpr-pill cpr-pill--more">+{branchPillLabels.length - 4} branches</span>
            ) : null}
          </div>
          <p className="cpr-hero-sub">
            {counts.all.toLocaleString()} programme{counts.all === 1 ? '' : 's'} (max {MAX_PREDICTOR_RESULTS})
            — your rank is within last year&apos;s closing rank for each row.
          </p>
        </header>

        <div className="cpr-stats">
          <button
            type="button"
            className={`cpr-stat ${typeFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('ALL')}
          >
            <span className="cpr-stat-n">{counts.all}</span>
            <span className="cpr-stat-l">All</span>
          </button>
          {exam === 'JEE_ADVANCED' ? (
            <button
              type="button"
              className={`cpr-stat ${typeFilter === 'IIT' ? 'is-active' : ''}`}
              onClick={() => setTypeFilter('IIT')}
            >
              <span className="cpr-stat-n">{counts.IIT}</span>
              <span className="cpr-stat-l">IIT</span>
            </button>
          ) : null}
          {exam === 'JEE_MAINS' ? (
            <>
              <button
                type="button"
                className={`cpr-stat ${typeFilter === 'NIT' ? 'is-active' : ''}`}
                onClick={() => setTypeFilter('NIT')}
              >
                <span className="cpr-stat-n">{counts.NIT}</span>
                <span className="cpr-stat-l">NIT</span>
              </button>
              <button
                type="button"
                className={`cpr-stat ${typeFilter === 'IIIT' ? 'is-active' : ''}`}
                onClick={() => setTypeFilter('IIIT')}
              >
                <span className="cpr-stat-n">{counts.IIIT}</span>
                <span className="cpr-stat-l">IIIT</span>
              </button>
            </>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <p className="cpr-none">No programmes in this filter.</p>
        ) : (
          <ul className="cpr-list">
            {filtered.map((row, i) => (
              <li key={`${row.institute}-${row.branch}-${row.closingRank}-${i}`} className="cpr-card">
                <div className={`cpr-card-type ${typeStyle(row.institutionType)}`}>
                  {row.institutionType}
                </div>
                <div className="cpr-card-body">
                  <h2 className="cpr-card-inst">{sanitizePredictorLine(row.institute, 160)}</h2>
                  <p className="cpr-card-branch">{sanitizePredictorLine(row.branch, 280)}</p>
                  <div className="cpr-card-ranks">
                    <div>
                      <span className="cpr-card-rk">Closing Rank</span>
                      <span className="cpr-card-rv">{row.closingRank}</span>
                    </div>
                  </div>

                </div>
                <div className={`cpr-card-badge ${getBadgeClass(row.likelihood)}`}>{row.likelihood || 'Likely'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
