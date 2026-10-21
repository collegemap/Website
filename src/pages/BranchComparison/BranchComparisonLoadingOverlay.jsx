import React, { useState, useEffect } from 'react';

const PIPELINE_STEPS = [
  'Pulling placement & recruiter signals',
  'Mapping academics, labs & curriculum',
  'Balancing culture & career fit',
  'Synthesizing scorecards & narrative',
];

const TIPS = [
  'JEE choices stick for years — a few extra seconds for a sharper picture is worth it.',
  'We compare both branches across placement, research, culture, and your question.',
  'Good decisions mix data with how you actually want to spend four years.',
  'Higher confidence tags mean the model leaned on stronger, clearer signals.',
];

/**
 * Rich loading UI while the BranchIntel /compare request runs (often 30–90s).
 */
const BranchComparisonLoadingOverlay = ({ active, compareSummary }) => {
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setPhase(0);
      setElapsed(0);
      setTipIndex(0);
      return;
    }

    setPhase(0);
    setElapsed(0);
    setTipIndex(0);

    const started = Date.now();
    const clock = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);

    const advancePhase = setInterval(() => {
      setPhase((p) => (p < PIPELINE_STEPS.length ? p + 1 : p));
    }, 3200);

    return () => {
      clearInterval(clock);
      clearInterval(advancePhase);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  const allStepsComplete = phase >= PIPELINE_STEPS.length;

  return (
    <div className="branch-intel-loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="branch-intel-loading-card">
        <div className="branch-intel-loading-header">
          <h3 className="branch-intel-loading-title">Crunching your comparison</h3>
          {compareSummary ? (
            <p className="branch-intel-loading-sub">{compareSummary}</p>
          ) : null}
        </div>

        <div className="branch-intel-loading-bar-wrap" aria-hidden="true">
          <div className="branch-intel-loading-bar-track">
            <div className="branch-intel-loading-bar-sweep" />
          </div>
          <p className="branch-intel-loading-bar-caption">
            Indeterminate progress — the model is still working
          </p>
        </div>

        <ul className="branch-intel-loading-steps">
          {PIPELINE_STEPS.map((label, i) => {
            const done = phase > i;
            const current = phase === i && phase < PIPELINE_STEPS.length;
            return (
              <li
                key={label}
                className={
                  'branch-intel-loading-step' +
                  (done ? ' branch-intel-loading-step--done' : '') +
                  (current ? ' branch-intel-loading-step--current' : '')
                }
              >
                <span className="branch-intel-loading-step-icon" aria-hidden="true">
                  {done ? '✓' : current ? '◆' : '○'}
                </span>
                <span className="branch-intel-loading-step-text">{label}</span>
              </li>
            );
          })}
        </ul>

        {allStepsComplete ? (
          <p className="branch-intel-loading-final">
            Final polish — scores and narrative are almost ready…
          </p>
        ) : null}

        <div className="branch-intel-loading-footer">
          <span className="branch-intel-loading-time">{elapsed}s elapsed</span>
          <span className="branch-intel-loading-hint">Usually 30–90 seconds · safe to wait here</span>
        </div>

        <p className="branch-intel-loading-tip" key={tipIndex}>
          <span className="branch-intel-loading-tip-label">Tip</span>
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
};

export default BranchComparisonLoadingOverlay;
