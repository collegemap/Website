(function () {
  const STORAGE_KEY = "branchintel_compare_result";
  const root = document.getElementById("content");

  function esc(s) {
    if (s == null) return "";
    const d = document.createElement("div");
    d.textContent = String(s);
    return d.innerHTML;
  }

  function metricRow(label, score, conf) {
    return `<div class="metric"><span>${esc(label)}</span><span><strong>${esc(
      score
    )}</strong> <span style="color:var(--muted)">(${esc(conf || "—")})</span></span></div>`;
  }

  /** Stage 1 — Intelligence gathering: per-agent claims in plain text */
  function renderStage1Text(s1) {
    if (!s1 || typeof s1 !== "object") {
      return '<p class="stage-target">No intelligence data returned.</p>';
    }
    const agentLabels = {
      placement_hunter: "Placement & recruiting",
      academic_scout: "Academics & research",
      alumni_tracker: "Alumni & careers",
      sentiment_agent: "Student experience & culture",
    };
    let html = "";
    const keys = Object.keys(s1).sort();
    for (const key of keys) {
      const bundle = s1[key];
      if (!bundle || typeof bundle !== "object") continue;
      const aid = bundle.agent_id || "";
      const label =
        agentLabels[aid] || aid.replace(/_/g, " ") || key.replace(/_/g, " ");
      html += `<h4>${esc(label)}</h4>`;
      if (bundle.target) {
        html += `<p class="stage-target">Focus: ${esc(bundle.target)}</p>`;
      }
      const claims = bundle.claims;
      if (Array.isArray(claims) && claims.length) {
        html += `<ul class="text-list">`;
        for (const c of claims) {
          const text = typeof c === "string" ? c : c.text;
          if (!text) continue;
          const conf = typeof c === "object" ? c.confidence : null;
          const date = typeof c === "object" ? c.date : null;
          const meta = [conf, date].filter(Boolean).join(" · ");
          html += `<li>${esc(text)}${
            meta
              ? ` <span class="claim-meta">(${esc(meta)})</span>`
              : ""
          }</li>`;
        }
        html += `</ul>`;
      }
      const gaps = bundle.gaps;
      if (Array.isArray(gaps) && gaps.length) {
        html += `<p class="stage-target"><strong>Gaps:</strong> ${esc(
          gaps.join("; ")
        )}</p>`;
      }
      if (bundle.conf_overall) {
        html += `<p class="stage-target">Overall confidence: <strong>${esc(
          bundle.conf_overall
        )}</strong></p>`;
      }
    }
    return html || '<p class="stage-target">No claims to show.</p>';
  }

  /** Stage 2 — Criteria weighting & evidence synthesis */
  function renderStage2Text(s2) {
    if (!s2 || typeof s2 !== "object") {
      return '<p class="stage-target">No reasoning data returned.</p>';
    }
    let html = "";
    const ip = s2.intent_profile || {};
    if (Object.keys(ip).length) {
      html += `<h4>How your question was interpreted</h4>`;
      if (ip.primary_intent) {
        html += `<p><strong>Primary intent:</strong> ${esc(ip.primary_intent)}</p>`;
      }
      if (Array.isArray(ip.criteria_priority) && ip.criteria_priority.length) {
        html += `<p><strong>Criteria priority (in order):</strong> ${esc(
          ip.criteria_priority.join(" → ")
        )}</p>`;
      }
      if (ip.weights && typeof ip.weights === "object") {
        html += `<p><strong>Relative weighting</strong> (how much each criterion mattered in this comparison):</p>`;
        for (const [k, v] of Object.entries(ip.weights)) {
          const pct =
            typeof v === "number"
              ? v <= 1
                ? Math.round(v * 100)
                : Math.round(v)
              : v;
          html += `<div class="weight-line"><span>${esc(k)}</span><span>${esc(
            pct
          )}%</span></div>`;
        }
      }
      const ic = ip.implicit_constraints;
      if (Array.isArray(ic) && ic.length) {
        html += `<p><strong>Inferred constraints:</strong> ${esc(ic.join("; "))}</p>`;
      }
    }

    const er = s2.evidence_record || {};
    if (er.branch1 || er.branch2) {
      html += `<h4>Synthesized evidence by branch</h4>`;
      for (const side of ["branch1", "branch2"]) {
        const b = er[side];
        if (!b || typeof b !== "object") continue;
        const label = b.branch_label || side;
        html += `<h4 style="margin-top:1rem">${esc(label)}</h4>`;

        const facts = b.top_facts;
        if (Array.isArray(facts) && facts.length) {
          html += `<p><strong>Top facts</strong></p><ul class="text-list">`;
          for (const f of facts) {
            const t = typeof f === "string" ? f : f.text;
            if (!t) continue;
            html += `<li>${esc(t)}</li>`;
          }
          html += `</ul>`;
        }
        const weak = b.weaknesses;
        if (Array.isArray(weak) && weak.length) {
          html += `<p><strong>Weaknesses / risks</strong></p><ul class="text-list">`;
          for (const w of weak) {
            const t = typeof w === "string" ? w : w.text;
            if (!t) continue;
            html += `<li>${esc(t)}</li>`;
          }
          html += `</ul>`;
        }
        if (b.conf_overall) {
          html += `<p class="stage-target">Evidence confidence: <strong>${esc(
            b.conf_overall
          )}</strong></p>`;
        }
      }
      if (er.conflict_rate != null && er.conflict_rate !== "") {
        html += `<p class="stage-target"><strong>Conflict rate between sources:</strong> ${esc(
          String(er.conflict_rate)
        )}</p>`;
      }
    }

    return html || '<p class="stage-target">No criteria or evidence block returned.</p>';
  }

  /** Stage 3 — Detailed scores & rationale (text, not JSON) */
  function renderStage3DetailText(s3) {
    if (!s3 || typeof s3 !== "object") {
      return '<p class="stage-target">No scorecard detail returned.</p>';
    }
    const dims = ["placement", "research", "culture", "career_fit"];

    function scorecardBlock(sc, title) {
      if (!sc || typeof sc !== "object") return "";
      let h = `<h4>${esc(title)}</h4>`;
      for (const d of dims) {
        const block = sc[d];
        if (!block || typeof block !== "object") continue;
        const name = d.replace("_", " ");
        h += `<div class="dim-block">`;
        h += `<h5>${esc(name)} — score ${esc(block.score)} (${esc(
          block.confidence || "—"
        )})</h5>`;
        if (block.reasoning) {
          h += `<p>${esc(block.reasoning)}</p>`;
        }
        const sup = block.supporting_claims;
        if (Array.isArray(sup) && sup.length) {
          h += `<ul class="text-list">`;
          for (const s of sup) {
            h += `<li>${esc(s)}</li>`;
          }
          h += `</ul>`;
        }
        h += `</div>`;
      }
      if (sc.overall != null) {
        h += `<p><strong>Overall:</strong> ${esc(sc.overall)}</p>`;
      }
      return h;
    }

    const sc1 = s3.scorecard1 || {};
    const sc2 = s3.scorecard2 || {};
    let html = scorecardBlock(
      sc1,
      sc1.branch_label ? `Branch A — ${sc1.branch_label}` : "Branch A"
    );
    html += scorecardBlock(
      sc2,
      sc2.branch_label ? `Branch B — ${sc2.branch_label}` : "Branch B"
    );
    return html || '<p class="stage-target">No score breakdown available.</p>';
  }

  function render(data) {
    const s3 = data.stage3 || {};
    const rec = s3.recommendation || {};
    const sc1 = s3.scorecard1 || {};
    const sc2 = s3.scorecard2 || {};
    const amb = rec.ambiguous ? " (ambiguous)" : "";

    const head = `
      <h1>Comparison result</h1>
      <p class="meta">
        Request <code>${esc(data.request_id)}</code> ·
        ${esc(data.processing_time_seconds)}s ·
        ${esc(data.total_agents_used)} agents
      </p>
      <p class="meta">
        <strong>${esc(data.branch1)} / ${esc(data.iit1)}</strong> vs
        <strong>${esc(data.branch2)} / ${esc(data.iit2)}</strong>
        ${data.user_query ? ` · “${esc(data.user_query)}”` : ""}
      </p>
      <div class="winner-banner">
        <div><strong>Winner</strong>${esc(amb)}</div>
        <div style="margin-top:0.35rem">${esc(rec.winner || "—")}</div>
      </div>
    `;

    const scores = `
      <h2>Scores</h2>
      <div class="score-grid">
        <div class="score-card">
          <h3>${esc(sc1.branch_label || data.branch1)}</h3>
          ${metricRow("Placement", sc1.placement?.score, sc1.placement?.confidence)}
          ${metricRow("Research", sc1.research?.score, sc1.research?.confidence)}
          ${metricRow("Culture", sc1.culture?.score, sc1.culture?.confidence)}
          ${metricRow("Career fit", sc1.career_fit?.score, sc1.career_fit?.confidence)}
          ${metricRow("Overall", sc1.overall, "—")}
        </div>
        <div class="score-card">
          <h3>${esc(sc2.branch_label || data.branch2)}</h3>
          ${metricRow("Placement", sc2.placement?.score, sc2.placement?.confidence)}
          ${metricRow("Research", sc2.research?.score, sc2.research?.confidence)}
          ${metricRow("Culture", sc2.culture?.score, sc2.culture?.confidence)}
          ${metricRow("Career fit", sc2.career_fit?.score, sc2.career_fit?.confidence)}
          ${metricRow("Overall", sc2.overall, "—")}
        </div>
      </div>
    `;

    const narrative = s3.narrative
      ? `<h2>Summary</h2><p class="narrative">${esc(s3.narrative)}</p>`
      : "";

    const recHtml = `
      <h2>Recommendation</h2>
      <div class="rec-box">
        <p><strong>Key reason:</strong> ${esc(rec.key_reason)}</p>
        <p><strong>Caveat:</strong> ${esc(rec.caveat)}</p>
        <p><strong>Confidence:</strong> ${esc(rec.confidence)}</p>
      </div>
    `;

    const details = `
      <h2>Full breakdown</h2>
      <details class="stage">
        <summary>Stage 1 — Intelligence gathering</summary>
        <div class="inner stage-prose">${renderStage1Text(data.stage1)}</div>
      </details>
      <details class="stage">
        <summary>Stage 2 — Criteria weighting &amp; evidence synthesis</summary>
        <div class="inner stage-prose">${renderStage2Text(data.stage2)}</div>
      </details>
      <details class="stage">
        <summary>Stage 3 — Detailed scores &amp; rationale</summary>
        <div class="inner stage-prose">${renderStage3DetailText(s3)}</div>
      </details>
    `;

    root.innerHTML = head + scores + narrative + recHtml + details;
  }

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    root.innerHTML = `<div class="empty-state"><p>No comparison data found.</p><p><a href="/">Go back to the form</a></p></div>`;
    return;
  }

  try {
    render(JSON.parse(raw));
  } catch {
    root.innerHTML = `<div class="empty-state"><p>Could not read saved results.</p><p><a href="/">Start over</a></p></div>`;
  }
})();
