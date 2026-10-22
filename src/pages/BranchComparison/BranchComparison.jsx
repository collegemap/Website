import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import './BranchComparison.scss';
import { fetchBranchCatalog, compareBranches } from '../../services/branchIntelApi';
import catalogStatic from '../../data/institutionBranchCatalog.json';
import BranchComparisonResults from './BranchComparisonResults';
import BranchComparisonLoadingOverlay from './BranchComparisonLoadingOverlay';
import { useAuth } from '../../context/AuthContext';
import { checkBranchComparisonAccess, trackBranchComparisonInput } from '../../services/supabaseService';
// const DEV_BYPASS_PAYMENT = process.env.NODE_ENV === 'development';


const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY_ID;
const BASE_URL = process.env.REACT_APP_API_URL || "https://backend-college-map.vercel.app";
const PAYMENT_AMOUNT = 30000; // ₹300 in paise

const INSTITUTION_TYPES = ['IIT', 'NIT', 'IIIT', 'Private'];
const PRIVATE_SOURCE_TYPES = ['BITS', 'VIT', 'SRM', 'Amrita', 'Other top colleges'];

function mergeBranchesMaps(...maps) {
  const merged = {};
  for (const m of maps) {
    if (!m) continue;
    for (const [college, branches] of Object.entries(m)) {
      if (Array.isArray(branches) && branches.length) merged[college] = branches;
    }
  }
  return merged;
}

/** Bundled private colleges — always available even if API omits Private. */
const PRIVATE_STATIC = mergeBranchesMaps(
  ...PRIVATE_SOURCE_TYPES.map((t) => catalogStatic[t]?.branchesByCollege),
  catalogStatic.Private?.branchesByCollege
);

function privateTypeCatalog(map) {
  const branchesByCollege = map && Object.keys(map).length ? map : PRIVATE_STATIC;
  return {
    colleges: Object.keys(branchesByCollege).sort(),
    branchesByCollege,
  };
}

/** Collect private-college branch maps from a catalog/API payload. */
function privateBranchesFromSource(source) {
  const maps = [PRIVATE_STATIC];
  if (!source) return mergeBranchesMaps(...maps);
  const byType = source.byType;
  const raw = byType || source;
  const privateMap = byType?.Private?.branchesByCollege;
  if (privateMap && Object.keys(privateMap).length) maps.push(privateMap);
  for (const t of PRIVATE_SOURCE_TYPES) {
    const m = byType?.[t]?.branchesByCollege || raw[t]?.branchesByCollege;
    if (m && Object.keys(m).length) maps.push(m);
  }
  return mergeBranchesMaps(...maps);
}

function buildTypeCatalog(source, type) {
  if (type === 'Private') return privateTypeCatalog(privateBranchesFromSource(source));
  const byType = source?.byType;
  const raw = byType || source;
  const m = byType?.[type]?.branchesByCollege || raw[type]?.branchesByCollege || {};
  return { colleges: Object.keys(m).sort(), branchesByCollege: m };
}

function staticCatalog() {
  const byType = {};
  for (const t of INSTITUTION_TYPES) {
    byType[t] = t === 'Private' ? privateTypeCatalog(PRIVATE_STATIC) : buildTypeCatalog(catalogStatic, t);
  }
  return { types: [...INSTITUTION_TYPES], byType };
}

/**
 * Merge API catalog with bundled JSON. Production APIs sometimes omit branches or
 * return keys that differ slightly — static data keeps dropdowns working after deploy.
 */
function mergeCatalogs(api, fallback) {
  const out = { types: [...INSTITUTION_TYPES], byType: {} };
  for (const t of INSTITUTION_TYPES) {
    if (t === 'Private') {
      const fbMap = privateBranchesFromSource(fallback);
      const apiMap = privateBranchesFromSource(api);
      const merged = { ...PRIVATE_STATIC };
      for (const college of new Set([...Object.keys(fbMap), ...Object.keys(apiMap)])) {
        const a = apiMap[college];
        const f = fbMap[college];
        const pick =
          Array.isArray(a) && a.length ? a : Array.isArray(f) && f.length ? f : merged[college];
        if (Array.isArray(pick) && pick.length) merged[college] = pick;
      }
      out.byType[t] = privateTypeCatalog(merged);
      continue;
    }
    const fbMap = fallback?.byType?.[t]?.branchesByCollege || {};
    const apiMap = api?.byType?.[t]?.branchesByCollege || {};
    const merged = {};
    // IIIT: bundled catalog uses short canonical names; APIs often still serve PDF-scrape garbage keys.
    if (t === 'IIIT') {
      for (const college of Object.keys(fbMap)) {
        const a = apiMap[college];
        const f = fbMap[college];
        const pick =
          Array.isArray(a) && a.length > 0 ? a : Array.isArray(f) && f.length > 0 ? f : [];
        if (pick.length) merged[college] = pick;
      }
    } else {
      const allKeys = new Set([...Object.keys(fbMap), ...Object.keys(apiMap)]);
      for (const college of allKeys) {
        const a = apiMap[college];
        const f = fbMap[college];
        const pick =
          Array.isArray(a) && a.length > 0 ? a : Array.isArray(f) && f.length > 0 ? f : [];
        if (pick.length) merged[college] = pick;
      }
    }
    out.byType[t] = {
      colleges: Object.keys(merged).sort(),
      branchesByCollege: merged,
    };
  }
  return out;
}

function normCollegeKey(s) {
  return String(s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Resolve branches for a college; handles whitespace / case mismatches vs catalog keys. */
function branchesForCollege(catalog, type, college) {
  if (!college || !catalog?.byType?.[type]?.branchesByCollege) return [];
  const m = catalog.byType[type].branchesByCollege;
  if (Array.isArray(m[college]) && m[college].length) return m[college];
  const n = normCollegeKey(college);
  const key = Object.keys(m).find((k) => normCollegeKey(k) === n);
  return key && Array.isArray(m[key]) ? m[key] : [];
}

function collegeOptionsList(catalog, type) {
  const colleges = catalog?.byType?.[type]?.colleges || [];
  return colleges.map((c) => ({ value: c, label: c }));
}

const BranchComparison = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [paying, setPaying] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [freeTries, setFreeTries] = useState(() => {
    return parseInt(localStorage.getItem('bc_free_tries') || '0', 10);
  });

  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [type1, setType1] = useState('IIT');
  const [type2, setType2] = useState('IIT');
  const [college1, setCollege1] = useState('');
  const [college2, setCollege2] = useState('');
  const [branch1, setBranch1] = useState('');
  const [branch2, setBranch2] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);
  const [result, setResult] = useState(null);

  const branchesFor1 = useMemo(
    () => branchesForCollege(catalog, type1, college1),
    [college1, type1, catalog]
  );

  const branchesFor2 = useMemo(
    () => branchesForCollege(catalog, type2, college2),
    [college2, type2, catalog]
  );

  const options1 = useMemo(() => collegeOptionsList(catalog, type1), [catalog, type1]);
  const options2 = useMemo(() => collegeOptionsList(catalog, type2), [catalog, type2]);

  useEffect(() => {
    setCollege1('');
    setBranch1('');
  }, [type1]);

  useEffect(() => {
    setCollege2('');
    setBranch2('');
  }, [type2]);

  useEffect(() => {
    setBranch1((prev) => (prev && branchesFor1.includes(prev) ? prev : ''));
  }, [college1, branchesFor1]);

  useEffect(() => {
    const verifyAccess = async () => {
      // if (DEV_BYPASS_PAYMENT) {        // ← add this
      //   setHasAccess(true);            // ← add this
      //   setCheckingAccess(false);      // ← add this
      //   return;                        // ← add this
      // }
      if (!isLoggedIn || !user?.email) {
        setHasAccess(false);
        setCheckingAccess(false);
        return;
      }
      setCheckingAccess(true);
      const access = await checkBranchComparisonAccess(user.email);
      setHasAccess(access);
      setCheckingAccess(false);
    };
    verifyAccess();
  }, [isLoggedIn, user]);

  useEffect(() => {
    setBranch2((prev) => (prev && branchesFor2.includes(prev) ? prev : ''));
  }, [college2, branchesFor2]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError('');
      setLoadingLists(true);
      try {
        const data = await fetchBranchCatalog();
        if (!cancelled) setCatalog(mergeCatalogs(data, staticCatalog()));
      } catch (e) {
        if (!cancelled) {
          setCatalog(staticCatalog());
          setLoadError(
            e.message
              ? `${e.message} Using built-in catalog from the last import.`
              : 'Using built-in IIT/NIT/IIIT catalog (offline).'
          );
        }
      } finally {
        if (!cancelled) setLoadingLists(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!type1 || !college1 || !branch1 || !type2 || !college2 || !branch2) {
      setSubmitError('Please choose institution type, college, and branch for both sides.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        institutionType1: type1,
        college1,
        branch1,
        institutionType2: type2,
        college2,
        branch2,
      };
      const q = userQuery.trim();
      if (q) payload.user_query = q;
      const data = await compareBranches(payload);
      setResult(data);

      const appliedPromo = localStorage.getItem('bc_applied_promo');
      trackBranchComparisonInput(user?.email, {
        college1, branch1, college2, branch2, userQuery: q, promoCode: appliedPromo
      });

      if (!hasAccess && freeTries > 0) {
        const newTries = freeTries - 1;
        setFreeTries(newTries);
        localStorage.setItem('bc_free_tries', newTries.toString());
      }

      try {
        sessionStorage.setItem('branchintel_compare_result', JSON.stringify(data));
      } catch {
        /* ignore */
      }
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewComparison = useCallback(() => {
    setResult(null);
    setSubmitError('');
    try {
      sessionStorage.removeItem('branchintel_compare_result');
    } catch {
      /* ignore */
    }
  }, []);

  const loadRazorpay = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const handlePayment = async () => {
    if (!isLoggedIn) {
      alert("Please log in first to make a payment.");
      navigate("/login");
      return;
    }

    try {
      setPaying(true);
      const loaded = await loadRazorpay();
      if (!loaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setPaying(false);
        return;
      }

      // Create order
      const orderRes = await fetch(`${BASE_URL}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: PAYMENT_AMOUNT,
          currency: "INR",
          receipt: `bc_${Date.now()}`,
        }),
      });
      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        throw new Error(errData.error || `Order creation failed (HTTP ${orderRes.status})`);
      }
      const orderData = await orderRes.json();

      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "CollegeMap",
        description: "Branch Comparison — 6 Months Access",
        order_id: orderData.id,
        prefill: {
          email: user?.email || '',
        },
        handler: async (response) => {
          try {
            // Validate payment AND save access on backend (server-side expiry)
            const validateRes = await fetch(`${BASE_URL}/order/validate-bc`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email: user.email,
              }),
            });
            if (!validateRes.ok) {
              const errData = await validateRes.json().catch(() => ({}));
              throw new Error(errData.msg || `Validation failed (HTTP ${validateRes.status})`);
            }
            const validateData = await validateRes.json();

            if (validateData.msg === "success") {
              setHasAccess(true);
              alert("Payment successful! You now have 6 months of access to Branch Comparison.");
            } else {
              alert("Payment validation failed. Please contact support.");
            }
          } catch (err) {
            console.error("Payment validation error:", err);
            alert(`Payment received but an error occurred: ${err.message}. Please contact support with your payment ID: ${response.razorpay_payment_id}`);
          } finally {
            setPaying(false);
          }
        },
        theme: { color: "#10c3bc" },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", (response) => {
        alert(`Payment failed: ${response.error.description}`);
        setPaying(false);
      });

      paymentObject.open();
    } catch (err) {
      console.error("Payment init error:", err);
      alert("Failed to initialize payment. Please try again.");
      setPaying(false);
    }
  };

  const selectStyles = useMemo(
    () => ({
      menuPortal: (base) => ({ ...base, zIndex: 10002 }),
      control: (base, state) => ({
        ...base,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: state.isFocused ? '#10c3bc' : 'rgba(16, 195, 188, 0.35)',
        minHeight: 44,
        boxShadow: state.isFocused ? '0 0 0 1px #10c3bc' : 'none',
        '&:hover': { borderColor: '#10c3bc' },
      }),
      menu: (base) => ({ ...base, borderRadius: 10, zIndex: 10002 }),
    }),
    []
  );

  if (result) {
    return (
      <div className="branch-comparison-bg branch-comparison-bg--results">
        <div className="branch-comparison-container branch-comparison-container--wide">
          <BranchComparisonResults data={result} onNewComparison={handleNewComparison} />
        </div>
      </div>
    );
  }

  if (checkingAccess) {
    return (
      <div className="branch-comparison-bg">
        <div className="branch-comparison-container">
          <p style={{ textAlign: "center", padding: "2rem" }}>Checking your access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess && freeTries <= 0) {
    return (
      <div className="branch-comparison-bg">
        <div className="branch-comparison-container" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
          <h2>Branch Comparison Premium(Demo)</h2>
          <div style={{ maxWidth: "600px", margin: "0 auto 1.5rem", borderRadius: "12px", overflow: "hidden", display: "flex", justifyContent: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}>
            <video
              controls
              playsInline
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <source src="/branch_comp.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center", gap: "10px" }}>
            <input
              type="text"
              placeholder="Have a promo code?"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ccc", outline: "none", textTransform: "uppercase", width: "200px" }}
            />
            <button
              className="branch-intel-btn"
              style={{ padding: "8px 16px", margin: 0, width: "auto" }}
              onClick={() => {
                const code = promoCode.trim().toUpperCase();
                const validCodes = {
                  'COLLEGEMAP2026': 5,
                  'FREETRIAL': 5,
                  'JOSAA2026': 5,
                };
                if (validCodes[code]) {
                  const tries = validCodes[code];
                  localStorage.setItem('bc_free_tries', tries.toString());
                  localStorage.setItem('bc_applied_promo', code);
                  setFreeTries(tries);
                  alert(`Promo code applied! You get ${tries} free tries.`);
                } else {
                  alert('Invalid promo code.');
                }
              }}
            >
              Apply
            </button>
          </div>

          <p style={{ margin: "0 0 1rem", fontSize: "1rem", color: "#555" }}>
            Get 6 months of unrestricted access to our powerful Branch Comparison tool for just ₹300.
          </p>

          {!isLoggedIn ? (
            <>
              <div style={{ background: "#fff3cd", color: "#856404", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #ffeeba", fontSize: "0.95rem" }}>
                <strong>Note:</strong> You must be logged in to purchase and use the premium tool.
              </div>
              <button className="branch-intel-login-btn" onClick={() => navigate('/login')}>
                Log In to Purchase
              </button>
            </>
          ) : (
            <button className="branch-intel-btn" onClick={handlePayment} disabled={paying}>
              {paying ? "Opening Payment Gateway..." : "Pay ₹300 for 6 Months Access"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Do not tie branch dropdowns to loadError: on deploy the catalog API may 404 while the
  // catch path still sets full data from staticCatalog() — branches must stay usable.
  const branch1Disabled = loadingLists || !catalog || !college1;
  const branch2Disabled = loadingLists || !catalog || !college2;

  const summaryLine =
    college1 && branch1 && college2 && branch2
      ? `${branch1} · ${college1} (${type1})  vs  ${branch2} · ${college2} (${type2})`
      : '';

  // return (
  //   <div className="branch-comparison-bg">
  //     <BranchComparisonLoadingOverlay active={loading} compareSummary={summaryLine} />

  //     <div className="branch-comparison-container branch-comparison-container--form-wide">
  //       <header className="branch-comparison-page-head">
  //         <h2>Branch Comparision</h2>
  //         <p className="branch-comparison-page-sub">
  //           Pick two branches — we&apos;ll help you see how they stack up.
  //         </p>
  //       </header>

  //       {loadError ? (
  //         <p className="branch-intel-form-error branch-intel-form-error--soft" role="status">
  //           {loadError}
  //         </p>
  //       ) : null}

  //       <form className="branch-intel-form" onSubmit={handleSubmit} noValidate>
  //         <div className="branch-intel-grid branch-intel-grid--compare">
  //           <div className="branch-intel-field">
  //             <label htmlFor="inst-type-1">Institution 1</label>
  //             <select
  //               id="inst-type-1"
  //               value={type1}
  //               onChange={(e) => setType1(e.target.value)}
  //               disabled={loadingLists}
  //             >
  //               {INSTITUTION_TYPES.map((t) => (
  //                 <option key={t} value={t}>
  //                   {t}
  //                 </option>
  //               ))}
  //             </select>
  //           </div>
  //           <div className="branch-intel-field">
  //             <label htmlFor="inst-type-2">Institution 2</label>
  //             <select
  //               id="inst-type-2"
  //               value={type2}
  //               onChange={(e) => setType2(e.target.value)}
  //               disabled={loadingLists}
  //             >
  //               {INSTITUTION_TYPES.map((t) => (
  //                 <option key={t} value={t}>
  //                   {t}
  //                 </option>
  //               ))}
  //             </select>
  //           </div>

  //           <div className="branch-intel-field">
  //             <label htmlFor="college-select-1" className="branch-intel-sublabel">
  //               College — search
  //             </label>
  //             <Select
  //               inputId="college-select-1"
  //               className="branch-intel-react-select"
  //               classNamePrefix="branch-intel-rs"
  //               isDisabled={loadingLists || !catalog}
  //               options={options1}
  //               value={college1 ? { value: college1, label: college1 } : null}
  //               onChange={(opt) => setCollege1(opt ? opt.value : '')}
  //               placeholder="Search college…"
  //               isClearable
  //               isSearchable
  //               menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
  //               styles={selectStyles}
  //               noOptionsMessage={() => 'No colleges match'}
  //             />
  //           </div>
  //           <div className="branch-intel-field">
  //             <label htmlFor="college-select-2" className="branch-intel-sublabel">
  //               College — search
  //             </label>
  //             <Select
  //               inputId="college-select-2"
  //               className="branch-intel-react-select"
  //               classNamePrefix="branch-intel-rs"
  //               isDisabled={loadingLists || !catalog}
  //               options={options2}
  //               value={college2 ? { value: college2, label: college2 } : null}
  //               onChange={(opt) => setCollege2(opt ? opt.value : '')}
  //               placeholder="Search college…"
  //               isClearable
  //               isSearchable
  //               menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
  //               styles={selectStyles}
  //               noOptionsMessage={() => 'No colleges match'}
  //             />
  //           </div>

  //           <div className="branch-intel-field">
  //             <label htmlFor="branch1">Branch 1</label>
  //             <select
  //               id="branch1"
  //               value={branch1}
  //               onChange={(e) => setBranch1(e.target.value)}
  //               disabled={branch1Disabled}
  //               required
  //             >
  //               <option value="">{college1 ? 'Choose branch' : 'Choose college first'}</option>
  //               {branchesFor1.map((b) => (
  //                 <option key={b} value={b}>
  //                   {b}
  //                 </option>
  //               ))}
  //             </select>
  //           </div>
  //           <div className="branch-intel-field">
  //             <label htmlFor="branch2">Branch 2</label>
  //             <select
  //               id="branch2"
  //               value={branch2}
  //               onChange={(e) => setBranch2(e.target.value)}
  //               disabled={branch2Disabled}
  //               required
  //             >
  //               <option value="">{college2 ? 'Choose branch' : 'Choose college first'}</option>
  //               {branchesFor2.map((b) => (
  //                 <option key={b} value={b}>
  //                   {b}
  //                 </option>
  //               ))}
  //             </select>
  //           </div>
  //         </div>

  //         <div className="branch-intel-field branch-intel-field--full">
  //           <label htmlFor="user_query">Your question (optional)</label>
  //           <textarea
  //             id="user_query"
  //             value={userQuery}
  //             onChange={(e) => setUserQuery(e.target.value)}
  //             placeholder="e.g. Which is better for a very good job?"
  //             rows={3}
  //           />
  //         </div>

  //         {submitError ? (
  //           <p className="branch-intel-form-error" role="alert">
  //             {submitError}
  //           </p>
  //         ) : null}

  //         <div className="branch-intel-actions">
  //           <button
  //             type="submit"
  //             className="branch-intel-btn"
  //             disabled={loading || loadingLists || !catalog}
  //           >
  //             Compare branches
  //           </button>
  //         </div>
  //         <p className="branch-intel-hint">
  //           IIT / NIT / IIIT lists come from JoSAA-style PDFs (dropdowns only). You can compare any
  //           combination across types.
  //         </p>
  //       </form>
  //     </div>
  //   </div>
  // );
  return (
    <div className="branch-comparison-bg">
      <BranchComparisonLoadingOverlay active={loading} compareSummary={summaryLine} />

      <div className="bc-tool-page">

        {/* ── Hero header ── */}
        <header className="bc-tool-header">
          <div className="bc-tool-header-left">
            <span className="bc-deco-plus-text bc-deco-plus-text--tl">+</span>
            <span className="bc-compare-label">COMPARE. DECIDE. SUCCEED.</span>
            <h2>Branch <span className="bc-teal">comparison</span></h2>
            <p>Compare two branches side by side and choose the right path for your future.</p>
          </div>
          <div className="bc-tool-header-right">
            {/* Decorative plus marks */}
            <span className="bc-deco-plus bc-deco-plus--1">+</span>
            <span className="bc-deco-plus bc-deco-plus--2">+</span>
            <span className="bc-deco-plus bc-deco-plus--3">+</span>
            <img
              src={`${process.env.PUBLIC_URL}/bc-tool.png`}
              alt="Branch comparison illustration"
              className="bc-tool-illustration"
            />
          </div>
        </header>

        {loadError && (
          <p className="branch-intel-form-error branch-intel-form-error--soft" role="status">
            {loadError}
          </p>
        )}

        <form className="bc-tool-form" onSubmit={handleSubmit} noValidate>

          {/* ── Face-off grid ── */}
          <div className="bc-faceoff">

            {/* Branch A */}
            <div className="bc-branch-card">
              <div className="bc-branch-card-head">
                <span className="bc-letter-badge bc-letter-badge--a">A</span>
                <span className="bc-card-title">Branch A</span>
              </div>

              <div className="bc-field-row">
                {/* <span className="bc-field-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </span> */}
                <div className="bc-field-inner">
                  <label htmlFor="inst-type-1">Institution Type</label>
                  <select id="inst-type-1" value={type1}
                    onChange={(e) => setType1(e.target.value)} disabled={loadingLists}>
                    <option value="" disabled>Select institution type</option>
                    {INSTITUTION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bc-field-row">
                {/* <span className="bc-field-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span> */}
                <div className="bc-field-inner">
                  <label htmlFor="college-select-1">College</label>
                  <Select
                    inputId="college-select-1"
                    className="branch-intel-react-select"
                    classNamePrefix="branch-intel-rs"
                    isDisabled={loadingLists || !catalog}
                    options={options1}
                    value={college1 ? { value: college1, label: college1 } : null}
                    onChange={(opt) => setCollege1(opt ? opt.value : '')}
                    placeholder="Search college…"
                    isClearable isSearchable
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    styles={selectStyles}
                    noOptionsMessage={() => 'No colleges match'}
                  />
                </div>
              </div>

              <div className="bc-field-row">
                {/* <span className="bc-field-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                </span> */}
                <div className="bc-field-inner">
                  <label htmlFor="branch1">Branch</label>
                  <select id="branch1" value={branch1}
                    onChange={(e) => setBranch1(e.target.value)}
                    disabled={branch1Disabled} required>
                    <option value="">{college1 ? 'Choose branch' : 'Choose college first'}</option>
                    {branchesFor1.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* VS */}
            <div className="bc-vs-divider">
              <div className="bc-vs-line" />
              <div className="bc-vs-circle">VS</div>
              <div className="bc-vs-line" />
            </div>

            {/* Branch B */}
            <div className="bc-branch-card">
              <div className="bc-branch-card-head">
                <span className="bc-letter-badge bc-letter-badge--b">B</span>
                <span className="bc-card-title">Branch B</span>
              </div>

              <div className="bc-field-row">
                {/* <span className="bc-field-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </span> */}
                <div className="bc-field-inner">
                  <label htmlFor="inst-type-2">Institution Type</label>
                  <select id="inst-type-2" value={type2}
                    onChange={(e) => setType2(e.target.value)} disabled={loadingLists}>
                    <option value="" disabled>Select institution type</option>
                    {INSTITUTION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bc-field-row">
                {/* <span className="bc-field-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span> */}
                <div className="bc-field-inner">
                  <label htmlFor="college-select-2">College</label>
                  <Select
                    inputId="college-select-2"
                    className="branch-intel-react-select"
                    classNamePrefix="branch-intel-rs"
                    isDisabled={loadingLists || !catalog}
                    options={options2}
                    value={college2 ? { value: college2, label: college2 } : null}
                    onChange={(opt) => setCollege2(opt ? opt.value : '')}
                    placeholder="Search college…"
                    isClearable isSearchable
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    styles={selectStyles}
                    noOptionsMessage={() => 'No colleges match'}
                  />
                </div>
              </div>

              <div className="bc-field-row">
                {/* <span className="bc-field-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                </span> */}
                <div className="bc-field-inner">
                  <label htmlFor="branch2">Branch</label>
                  <select id="branch2" value={branch2}
                    onChange={(e) => setBranch2(e.target.value)}
                    disabled={branch2Disabled} required>
                    <option value="">{college2 ? 'Choose branch' : 'Choose college first'}</option>
                    {branchesFor2.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Question row ── */}
          <div className="bc-question-row">
            <span className="bc-question-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </span>
            <div className="bc-question-inner">
              <label htmlFor="user_query">
                YOUR QUESTION <span className="bc-optional">(optional)</span>
              </label>
              <input
                id="user_query" type="text" value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="e.g. Which is better for a very good job?"
              />
            </div>
          </div>

          {submitError && (
            <p className="branch-intel-form-error" role="alert">{submitError}</p>
          )}

          {/* ── Footer ── */}
          <div className="bc-tool-footer">

            <button type="submit" className="bc-compare-btn"
              disabled={loading || loadingLists || !catalog}>
              Compare branches &nbsp;→
            </button>
          </div>
          {!hasAccess && freeTries > 0 && (
            <p style={{ marginTop: '15px', color: '#888', fontSize: '13px', textAlign: 'center' }}>
              Free tries remaining: {freeTries}/5
            </p>
          )}

        </form>
      </div>
    </div>
  );
};

export default BranchComparison;