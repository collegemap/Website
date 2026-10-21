import React from 'react';

function esc(s) {
  if (s == null) return '';
  return String(s);
}

/**
 * Highlights key terms in Stage 1–3 prose (confidence, years, metrics, IIT/domain keywords).
 * Returns React nodes (safe — no HTML injection).
 */
const KEY_TERM_REGEX = new RegExp(
  [
    '(\\b(?:HIGH|MED|LOW)\\b)',
    '(\\b20\\d{2}\\b)',
    '(\\d+(?:\\.\\d+)?\\s*(?:%|LPA|lpa)\\b)',
    '(\\d+(?:\\.\\d+)?\\s*(?:crore|Cr)\\b)',
    '(₹\\s*[\\d,.]+(?:\\s*(?:LPA|Cr|crore|lakhs?))?)',
    '(\\b(?:NIRF|FAANG|PPO|CTC|IPO|GATE|JEE|Advanced|KVPY)\\b)',
    '(\\bIIT(?:\\s+[A-Za-z][A-Za-z\\s.&()-]{0,48})?)',
    '(\\b(?:NIT|IIIT)\\b)',
    '(\\b(?:MS|PhD|MBA|B\\.?Tech|M\\.?Tech|PSU|PSUs|VLSI|R&D|SDE|PM)\\b)',
    '(\\b(?:placement|placements|package|packages|median|average|stipend|ranking|rankings|internship|internships|alumni|faculty|scholarship|fellowship|recruiter|recruiters|cut-?off|cutoff|campus|research|labs?|curriculum|semester|semesters|department|departments|core|sector|sectors|startup|startups|venture|ventures)\\b)',
  ].join('|'),
  'gi'
);

function highlightKeyTerms(text, keyPrefix = 'kt') {
  if (text == null || text === '') return text;
  const s = String(text);
  const re = new RegExp(KEY_TERM_REGEX.source, KEY_TERM_REGEX.flags);
  const nodes = [];
  let last = 0;
  let m;
  let k = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      nodes.push(s.slice(last, m.index));
    }
    nodes.push(
      <strong key={`${keyPrefix}-${k++}`} className="branch-intel-keyterm">
        {m[0]}
      </strong>
    );
    last = m.index + m[0].length;
    if (m[0].length === 0) {
      re.lastIndex++;
    }
  }
  if (last < s.length) {
    nodes.push(s.slice(last));
  }
  return nodes.length ? nodes : s;
}

function MetricRow({ label, score, conf }) {
  return (
    <div className="branch-intel-metric">
      <span>{esc(label)}</span>
      <span>
        <strong>{esc(score)}</strong>{' '}
        <span className="branch-intel-muted">({esc(conf || '—')})</span>
      </span>
    </div>
  );
}

function renderStage1Text(s1) {
  if (!s1 || typeof s1 !== 'object') {
    return <p className="branch-intel-stage-target">No intelligence data returned.</p>;
  }
  const agentLabels = {
    placement_hunter: 'Placement & recruiting',
    academic_scout: 'Academics & research',
    alumni_tracker: 'Alumni & careers',
    sentiment_agent: 'Student experience & culture',
  };
  const keys = Object.keys(s1).sort();
  const blocks = [];
  for (const key of keys) {
    const bundle = s1[key];
    if (!bundle || typeof bundle !== 'object') continue;
    const aid = bundle.agent_id || '';
    const label =
      agentLabels[aid] || aid.replace(/_/g, ' ') || key.replace(/_/g, ' ');
    blocks.push(
      <React.Fragment key={key}>
        <h4>{esc(label)}</h4>
        {bundle.target ? (
          <p className="branch-intel-stage-target">
            Focus: {highlightKeyTerms(bundle.target, `s1t-${key}`)}
          </p>
        ) : null}
        {Array.isArray(bundle.claims) && bundle.claims.length ? (
          <ul className="branch-intel-text-list">
            {bundle.claims.map((c, i) => {
              const text = typeof c === 'string' ? c : c.text;
              if (!text) return null;
              const cconf = typeof c === 'object' ? c.confidence : null;
              const date = typeof c === 'object' ? c.date : null;
              const meta = [cconf, date].filter(Boolean).join(' · ');
              return (
                <li key={i}>
                  {highlightKeyTerms(text, `s1c-${key}-${i}`)}
                  {meta ? (
                    <span className="branch-intel-claim-meta">
                      {' '}
                      ({highlightKeyTerms(meta, `s1m-${key}-${i}`)})
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
        {Array.isArray(bundle.gaps) && bundle.gaps.length ? (
          <p className="branch-intel-stage-target">
            <strong>Gaps:</strong> {highlightKeyTerms(bundle.gaps.join('; '), `s1g-${key}`)}
          </p>
        ) : null}
        {bundle.conf_overall ? (
          <p className="branch-intel-stage-target">
            Overall confidence: {highlightKeyTerms(bundle.conf_overall, `s1co-${key}`)}
          </p>
        ) : null}
      </React.Fragment>
    );
  }
  if (!blocks.length) {
    return <p className="branch-intel-stage-target">No claims to show.</p>;
  }
  return <>{blocks}</>;
}

function renderStage2Text(s2) {
  if (!s2 || typeof s2 !== 'object') {
    return <p className="branch-intel-stage-target">No reasoning data returned.</p>;
  }
  const parts = [];
  const ip = s2.intent_profile || {};
  if (Object.keys(ip).length) {
    parts.push(<h4 key="h-intent">How your question was interpreted</h4>);
    if (ip.primary_intent) {
      parts.push(
        <p key="pi">
          <strong>Primary intent:</strong> {highlightKeyTerms(ip.primary_intent, 's2pi')}
        </p>
      );
    }
    if (Array.isArray(ip.criteria_priority) && ip.criteria_priority.length) {
      parts.push(
        <p key="cp">
          <strong>Criteria priority (in order):</strong>{' '}
          {highlightKeyTerms(ip.criteria_priority.join(' → '), 's2cp')}
        </p>
      );
    }
    if (ip.weights && typeof ip.weights === 'object') {
      parts.push(
        <p key="w">
          <strong>Relative weighting</strong> (how much each criterion mattered in this comparison):
        </p>
      );
      for (const [k, v] of Object.entries(ip.weights)) {
        const pct =
          typeof v === 'number' ? (v <= 1 ? Math.round(v * 100) : Math.round(v)) : v;
        parts.push(
          <div className="branch-intel-weight-line" key={`w-${k}`}>
            <span>{highlightKeyTerms(k, `s2wk-${k}`)}</span>
            <span>{highlightKeyTerms(String(pct), `s2wp-${k}`)}%</span>
          </div>
        );
      }
    }
    const ic = ip.implicit_constraints;
    if (Array.isArray(ic) && ic.length) {
      parts.push(
        <p key="ic">
          <strong>Inferred constraints:</strong> {highlightKeyTerms(ic.join('; '), 's2ic')}
        </p>
      );
    }
  }

  const er = s2.evidence_record || {};
  if (er.branch1 || er.branch2) {
    parts.push(<h4 key="h-ev">Synthesized evidence by branch</h4>);
    for (const side of ['branch1', 'branch2']) {
      const b = er[side];
      if (!b || typeof b !== 'object') continue;
      const label = b.branch_label || side;
      parts.push(
        <h4 key={`h-${side}`} style={{ marginTop: '1rem' }}>
          {highlightKeyTerms(label, `s2lb-${side}`)}
        </h4>
      );
      const facts = b.top_facts;
      if (Array.isArray(facts) && facts.length) {
        parts.push(
          <p key={`tf-${side}`}>
            <strong>Top facts</strong>
          </p>
        );
        parts.push(
          <ul className="branch-intel-text-list" key={`tfl-${side}`}>
            {facts.map((f, i) => {
              const t = typeof f === 'string' ? f : f.text;
              if (!t) return null;
              return <li key={i}>{highlightKeyTerms(t, `s2f-${side}-${i}`)}</li>;
            })}
          </ul>
        );
      }
      const weak = b.weaknesses;
      if (Array.isArray(weak) && weak.length) {
        parts.push(
          <p key={`wk-${side}`}>
            <strong>Weaknesses / risks</strong>
          </p>
        );
        parts.push(
          <ul className="branch-intel-text-list" key={`wkl-${side}`}>
            {weak.map((w, i) => {
              const t = typeof w === 'string' ? w : w.text;
              if (!t) return null;
              return <li key={i}>{highlightKeyTerms(t, `s2w-${side}-${i}`)}</li>;
            })}
          </ul>
        );
      }
      if (b.conf_overall) {
        parts.push(
          <p className="branch-intel-stage-target" key={`co-${side}`}>
            Evidence confidence: {highlightKeyTerms(b.conf_overall, `s2co-${side}`)}
          </p>
        );
      }
    }
    if (er.conflict_rate != null && er.conflict_rate !== '') {
      parts.push(
        <p className="branch-intel-stage-target" key="cr">
          <strong>Conflict rate between sources:</strong>{' '}
          {highlightKeyTerms(String(er.conflict_rate), 's2cr')}
        </p>
      );
    }
  }

  if (!parts.length) {
    return <p className="branch-intel-stage-target">No criteria or evidence block returned.</p>;
  }
  return <>{parts}</>;
}

const DIMS = ['placement', 'research', 'culture', 'career_fit'];

function ScorecardBlock({ sc, title, blockPrefix = 'sc' }) {
  if (!sc || typeof sc !== 'object') return null;
  const p = blockPrefix;
  const blocks = [];
  blocks.push(<h4 key="t">{highlightKeyTerms(title, `${p}-h4`)}</h4>);
  for (const d of DIMS) {
    const block = sc[d];
    if (!block || typeof block !== 'object') continue;
    const name = d.replace(/_/g, ' ');
    blocks.push(
      <div className="branch-intel-dim-block" key={d}>
        <h5>
          {highlightKeyTerms(name, `${p}-dn-${d}`)} — score {highlightKeyTerms(String(block.score), `${p}-ds-${d}`)} (
          {highlightKeyTerms(String(block.confidence || '—'), `${p}-dc-${d}`)})
        </h5>
        {block.reasoning ? (
          <p>{highlightKeyTerms(block.reasoning, `${p}-dr-${d}`)}</p>
        ) : null}
        {Array.isArray(block.supporting_claims) && block.supporting_claims.length ? (
          <ul className="branch-intel-text-list">
            {block.supporting_claims.map((s, i) => (
              <li key={i}>{highlightKeyTerms(s, `${p}-cl-${d}-${i}`)}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
  if (sc.overall != null) {
    blocks.push(
      <p key="ov">
        <strong>Overall:</strong> {highlightKeyTerms(String(sc.overall), `${p}-ov`)}
      </p>
    );
  }
  return <>{blocks}</>;
}

function renderStage3DetailText(s3) {
  if (!s3 || typeof s3 !== 'object') {
    return <p className="branch-intel-stage-target">No scorecard detail returned.</p>;
  }
  const sc1 = s3.scorecard1 || {};
  const sc2 = s3.scorecard2 || {};
  return (
    <>
      <ScorecardBlock
        sc={sc1}
        blockPrefix="s3a"
        title={sc1.branch_label ? `Branch A — ${sc1.branch_label}` : 'Branch A'}
      />
      <ScorecardBlock
        sc={sc2}
        blockPrefix="s3b"
        title={sc2.branch_label ? `Branch B — ${sc2.branch_label}` : 'Branch B'}
      />
    </>
  );
}

/**
 * @param {{ data: object, onNewComparison: () => void }} props
 */
const BranchComparisonResults = ({ data, onNewComparison }) => {
  const s3 = data.stage3 || {};
  const rec = s3.recommendation || {};
  const sc1 = s3.scorecard1 || {};
  const sc2 = s3.scorecard2 || {};
  const amb = rec.ambiguous ? ' (ambiguous)' : '';

  return (
    <div className="branch-comparison-results">
      <div className="branch-intel-back-row">
        <button type="button" className="branch-intel-btn-ghost" onClick={onNewComparison}>
          ← New comparison
        </button>
      </div>

      <header className="branch-intel-results-hero" aria-label="Compared branches">
        <div className="branch-intel-compare-grid">
          <article className="branch-intel-compare-card">
            {data.institutionType1 ? (
              <span className="branch-intel-pill">{esc(data.institutionType1)}</span>
            ) : null}
            <h2 className="branch-intel-compare-branch">{esc(data.branch1)}</h2>
            <p className="branch-intel-compare-school">{esc(data.college1 || data.iit1)}</p>
          </article>
          <div className="branch-intel-vs" aria-hidden>
            vs
          </div>
          <article className="branch-intel-compare-card">
            {data.institutionType2 ? (
              <span className="branch-intel-pill">{esc(data.institutionType2)}</span>
            ) : null}
            <h2 className="branch-intel-compare-branch">{esc(data.branch2)}</h2>
            <p className="branch-intel-compare-school">{esc(data.college2 || data.iit2)}</p>
          </article>
        </div>
        {data.user_query ? (
          <p className="branch-intel-query-note">
            <span className="branch-intel-query-label">Your focus</span>
            <span className="branch-intel-query-text">&ldquo;{esc(data.user_query)}&rdquo;</span>
          </p>
        ) : null}
      </header>

      <div className="branch-intel-winner-banner">
        <div>
          <strong>Winner</strong>
          {esc(amb)}
        </div>
        <div style={{ marginTop: '0.35rem' }}>{esc(rec.winner || '—')}</div>
      </div>

      <h2 className="branch-intel-h2">Scores</h2>
      <div className="branch-intel-score-grid">
        <div className="branch-intel-score-card">
          <h3>{esc(sc1.branch_label || data.branch1)}</h3>
          <MetricRow label="Placement" score={sc1.placement?.score} conf={sc1.placement?.confidence} />
          <MetricRow label="Research" score={sc1.research?.score} conf={sc1.research?.confidence} />
          <MetricRow label="Culture" score={sc1.culture?.score} conf={sc1.culture?.confidence} />
          <MetricRow
            label="Career fit"
            score={sc1.career_fit?.score}
            conf={sc1.career_fit?.confidence}
          />
          <MetricRow label="Overall" score={sc1.overall} conf="—" />
        </div>
        <div className="branch-intel-score-card">
          <h3>{esc(sc2.branch_label || data.branch2)}</h3>
          <MetricRow label="Placement" score={sc2.placement?.score} conf={sc2.placement?.confidence} />
          <MetricRow label="Research" score={sc2.research?.score} conf={sc2.research?.confidence} />
          <MetricRow label="Culture" score={sc2.culture?.score} conf={sc2.culture?.confidence} />
          <MetricRow
            label="Career fit"
            score={sc2.career_fit?.score}
            conf={sc2.career_fit?.confidence}
          />
          <MetricRow label="Overall" score={sc2.overall} conf="—" />
        </div>
      </div>

      {s3.narrative ? (
        <>
          <h2 className="branch-intel-h2">Summary</h2>
          <p className="branch-intel-narrative">{esc(s3.narrative)}</p>
        </>
      ) : null}

      <h2 className="branch-intel-h2">Recommendation</h2>
      <div className="branch-intel-rec-box">
        <p>
          <strong>Key reason:</strong> {esc(rec.key_reason)}
        </p>
        <p>
          <strong>Caveat:</strong> {esc(rec.caveat)}
        </p>
        <p>
          <strong>Confidence:</strong> {esc(rec.confidence)}
        </p>
      </div>

      <h2 className="branch-intel-h2">Full breakdown</h2>
      <details className="branch-intel-stage">
        <summary>Stage 1 — Intelligence gathering</summary>
        <div className="branch-intel-inner branch-intel-stage-prose">{renderStage1Text(data.stage1)}</div>
      </details>
      <details className="branch-intel-stage">
        <summary>Stage 2 — Criteria weighting &amp; evidence synthesis</summary>
        <div className="branch-intel-inner branch-intel-stage-prose">{renderStage2Text(data.stage2)}</div>
      </details>
      <details className="branch-intel-stage">
        <summary>Stage 3 — Detailed scores &amp; rationale</summary>
        <div className="branch-intel-inner branch-intel-stage-prose">{renderStage3DetailText(s3)}</div>
      </details>
    </div>
  );
};

export default BranchComparisonResults;
