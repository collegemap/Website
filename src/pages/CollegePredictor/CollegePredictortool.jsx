import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './CollegePredictor.scss';
import { predictCutoffs, MAX_PREDICTOR_RESULTS, CATEGORY_OPTIONS, resolveCategoryFilters } from './predictorFilter';
import { BRANCH_PRESETS } from './branchPresets';
import { useAuth } from '../../context/AuthContext';
import { trackCollegePredictorInput } from '../../services/supabaseService';

const DATA_URL = `${process.env.PUBLIC_URL || ''}/data/jee_cutoffs_final.json`;

export default function CollegePredictortool() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [exam, setExam] = useState('JEE_ADVANCED');
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('OPEN');
  const [genderFemale, setGenderFemale] = useState(false);
  const [seatPool, setSeatPool] = useState('ALL_INDIA');
  const [mainInstitutions, setMainInstitutions] = useState('BOTH');
  const [preferredBranchIds, setPreferredBranchIds] = useState([]);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingData(true);
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setEntries(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => {
        if (!cancelled) setLoadError('unavailable');
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const animateCounter = (id, target, duration, suffix) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + (progress >= 1 ? suffix : '');
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    animateCounter('cp-counter-colleges', 600, 1800, '+');
    animateCounter('cp-counter-years', 7, 900, 'yrs');
  }, []);

  const institutionTypes = useMemo(() => {
    if (exam === 'JEE_ADVANCED') return ['IIT'];
    if (mainInstitutions === 'NIT') return ['NIT'];
    if (mainInstitutions === 'IIIT') return ['IIIT'];
    return ['NIT', 'IIIT'];
  }, [exam, mainInstitutions]);

  const toggleBranch = useCallback((id) => {
    setPreferredBranchIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const run = useCallback(
    (e) => {
      e.preventDefault();
      setSubmitError('');
      const r = parseInt(String(rank).replace(/\s/g, ''), 10);
      if (!Number.isFinite(r) || r < 1) {
        setSubmitError('Enter rank');
        return;
      }
      const { pwd } = resolveCategoryFilters(category);

      trackCollegePredictorInput(user?.email, {
        exam, rank: r, category, genderFemale, seatPool
      });

      const rows = predictCutoffs(entries, {
        exam, rank: r, category, genderFemale, seatPool,
        institutionTypes, maxResults: MAX_PREDICTOR_RESULTS, preferredBranchIds, pwd,
      });
      navigate('/CollegePredictor/results', {
        state: {
          predictorPayload: {
            rank: r, exam, category, genderFemale, seatPool,
            mainInstitutions: exam === 'JEE_MAINS' ? mainInstitutions : null,
            preferredBranchIds, results: rows, pwd,
          },
        },
      });
    },
    [entries, exam, rank, category, genderFemale, seatPool,
     institutionTypes, mainInstitutions, preferredBranchIds, navigate, user]
  );

  return (
    <div className="cp-tool-page">

      {/* ── CONTENT ROW: Steps 30% + Form 70% ── */}
      <div className="cp-hero-layout">

        {/* ── LEFT — Badge + Heading + Steps (30%) ── */}
        <div className="cp-left-section">
          <span className="cp-badge">Predict Your College</span>
          <h1 className="cp-main-heading">
            Your rank.<br /><span>Our prediction.</span>
          </h1>

          <div className="cp-steps">
            <div className="cp-step">
              <div className="cp-step-icon">1</div>
              <div className="cp-step-content">
                <strong>Enter your exam &amp; rank</strong>
                <span>JEE Advanced or JEE Main — your CRL or category rank</span>
              </div>
            </div>

            <div className="cp-step-line" />

            <div className="cp-step">
              <div className="cp-step-icon">2</div>
              <div className="cp-step-content">
                <strong>Set category, gender &amp; preferences</strong>
                <span>Filter by seat pool, institution type and preferred branches</span>
              </div>
            </div>

            <div className="cp-step-line" />

            <div className="cp-step">
              <div className="cp-step-icon">3</div>
              <div className="cp-step-content">
                <strong>Get your personalised college list</strong>
                <span>Up to 75 colleges ranked by your chances — instantly</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Form (70%) ── */}
        <div className="cp-right-section">
          <form className="cp-form-card" onSubmit={run}>

            <div className="cp-field-block">
              <label htmlFor="cp-exam">Exam</label>
              <select
                id="cp-exam"
                value={exam}
                onChange={(ev) => setExam(ev.target.value)}
                disabled={loadingData}
              >
                <option value="JEE_ADVANCED">JEE Advanced</option>
                <option value="JEE_MAINS">JEE Main</option>
              </select>
            </div>

            <div className="cp-field-block">
              <label htmlFor="cp-rank">Rank</label>
              <input
                id="cp-rank"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="Enter your CRL / category rank"
                value={rank}
                onChange={(ev) => setRank(ev.target.value)}
                disabled={loadingData}
              />
            </div>

            <div className="cp-field-block">
              <label htmlFor="cp-cat">Category</label>
              <select
                id="cp-cat"
                value={category}
                onChange={(ev) => setCategory(ev.target.value)}
                disabled={loadingData}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="cp-field-block">
              <label htmlFor="cp-gen">Gender</label>
              <select
                id="cp-gen"
                value={genderFemale ? 'f' : 'n'}
                onChange={(ev) => setGenderFemale(ev.target.value === 'f')}
                disabled={loadingData}
              >
                <option value="n">Neutral</option>
                <option value="f">Female</option>
              </select>
            </div>

            {exam === 'JEE_MAINS' && (
              <>
                <div className="cp-field-block">
                  <label htmlFor="cp-pool">Seat Pool</label>
                  <select
                    id="cp-pool"
                    value={seatPool}
                    onChange={(ev) => setSeatPool(ev.target.value)}
                    disabled={loadingData}
                  >
                    <option value="ALL_INDIA">All India</option>
                    <option value="HOME_STATE">Home state</option>
                  </select>
                </div>

                <div className="cp-field-block">
                  <label>Institutes</label>
                  <div className="cp-radio-group">
                    <label className="cp-radio-opt">
                      <input type="radio" name="cp-main-inst"
                        checked={mainInstitutions === 'BOTH'}
                        onChange={() => setMainInstitutions('BOTH')}
                        disabled={loadingData} />
                      Both NIT &amp; IIIT
                    </label>
                    <label className="cp-radio-opt">
                      <input type="radio" name="cp-main-inst"
                        checked={mainInstitutions === 'NIT'}
                        onChange={() => setMainInstitutions('NIT')}
                        disabled={loadingData} />
                      NIT only
                    </label>
                    <label className="cp-radio-opt">
                      <input type="radio" name="cp-main-inst"
                        checked={mainInstitutions === 'IIIT'}
                        onChange={() => setMainInstitutions('IIIT')}
                        disabled={loadingData} />
                      IIIT only
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="cp-field-block">
              <label id="cp-branch-label">
                Branches
                <span className="cp-field-hint">Optional — leave unchecked for all branches</span>
              </label>
              <details className="cp-dropdown">
                <summary className="cp-dropdown-head">
                  {preferredBranchIds.length === 0
                    ? 'Select Preferred Branches'
                    : `${preferredBranchIds.length} branch${preferredBranchIds.length > 1 ? 'es' : ''} selected`}
                </summary>
                <div className="cp-branch-list" role="group" aria-labelledby="cp-branch-label">
                  {BRANCH_PRESETS.map((p) => (
                    <label key={p.id} className="cp-branch-row">
                      <input
                        type="checkbox"
                        className="cp-branch-checkbox"
                        checked={preferredBranchIds.includes(p.id)}
                        onChange={() => toggleBranch(p.id)}
                        disabled={loadingData}
                      />
                      <span className="cp-branch-text">{p.label}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>

            {(loadError || submitError) && (
              <p className="cp-err">{loadError ? 'Data unavailable' : submitError}</p>
            )}

            <button
              type="submit"
              className="cp-submit-btn"
              disabled={loadingData || !!loadError}
            >
              Predict Colleges →
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}