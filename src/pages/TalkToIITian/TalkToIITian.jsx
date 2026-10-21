import React, { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from 'react-helmet-async';
import "./TalkToIITian.css";

const BASE_URL = process.env.REACT_APP_API_URL || "https://collegemapbackend.vercel.app";
const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY_ID;
const PAYMENT_AMOUNT = 50000; // ₹500

// ── localStorage keys ────────────────────────────────────────────────────
const LS_PAYMENT_ID = "tti_payment_id";
const LS_ORDER_ID = "tti_order_id";
const LS_FORM_SUBMITTED = "tti_form_submitted";

// ── Step definitions ─────────────────────────────────────────────────────
const STEPS = ["landing", "video", "payment", "form", "confirmation"];
const STEP_LABELS = ["Info", "Demo", "Pay", "Details", "Done"];

// ── Progress Bar Component ───────────────────────────────────────────────
const ProgressBar = ({ currentStep }) => {
  const currentIdx = STEPS.indexOf(currentStep);
  if (currentIdx <= 0) return null; // hide on landing

  return (
    <div className="tti-progress-bar" role="navigation" aria-label="Progress">
      {STEP_LABELS.slice(1).map((label, i) => {
        const stepIdx = i + 1; // offset by 1 since we skip "landing"
        const isActive = stepIdx === currentIdx;
        const isCompleted = stepIdx < currentIdx;

        return (
          <div className="tti-progress-step" key={label}>
            <div
              className={`tti-progress-circle ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
              aria-current={isActive ? "step" : undefined}
            >
              {isCompleted ? "✓" : stepIdx}
            </div>
            {i < STEP_LABELS.length - 2 && (
              <div className={`tti-progress-line ${isCompleted ? "completed" : ""}`} />
            )}
            <span className={`tti-progress-label ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Main Component
const TalkToIITian = () => {
  const [step, setStep] = useState("landing");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);

  // Payment data stored across steps
  const paymentDataRef = useRef({
    paymentId: null,
    orderId: null,
  });

  // Form state
  const [form, setForm] = useState({
    name: "",
    phone: "",
    college: "",
    branch: "",
    queries: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Scroll to top on every step change ──────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  // ── Recovery: check localStorage on mount ──────────────────────────────
  useEffect(() => {
    const savedPaymentId = localStorage.getItem(LS_PAYMENT_ID);
    const savedOrderId = localStorage.getItem(LS_ORDER_ID);
    const formSubmitted = localStorage.getItem(LS_FORM_SUBMITTED);

    if (savedPaymentId && savedOrderId && formSubmitted !== "true") {
      // User paid but never submitted the form
      paymentDataRef.current = {
        paymentId: savedPaymentId,
        orderId: savedOrderId,
      };
      setIsRecovery(true);
      setStep("form");
    }
  }, []);

  // ── Back-navigation protection on form step ────────────────────────────
  useEffect(() => {
    if (step !== "form") return;

    // Push an extra history entry so "back" triggers popstate
    window.history.pushState({ ttiForm: true }, "");

    const handlePopState = (e) => {
      // Re-push to prevent actual navigation
      window.history.pushState({ ttiForm: true }, "");
      setShowBackWarning(true);
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [step]);

  // ── Razorpay script loader ─────────────────────────────────────────────
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

  // ── Handle payment ─────────────────────────────────────────────────────
  const handlePayment = useCallback(async () => {
    setIsProcessing(true);

    const loaded = await loadRazorpay();
    if (!loaded) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      setIsProcessing(false);
      return;
    }

    try {
      // Create order on backend
      const orderRes = await fetch(`${BASE_URL}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: PAYMENT_AMOUNT,
          currency: "INR",
          receipt: `tti_${Date.now()}`,
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
        description: "Talk to IITian — 1:1 Mentorship",
        order_id: orderData.id,
        handler: async (response) => {
          try {
            // Validate payment
            const validateRes = await fetch(`${BASE_URL}/order/validate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!validateRes.ok) {
              const errData = await validateRes.json().catch(() => ({}));
              throw new Error(errData.msg || `Validation failed (HTTP ${validateRes.status})`);
            }
            const validateData = await validateRes.json();

            if (validateData.msg === "success") {
              // Save to localStorage for recovery
              localStorage.setItem(LS_PAYMENT_ID, response.razorpay_payment_id);
              localStorage.setItem(LS_ORDER_ID, response.razorpay_order_id);
              localStorage.removeItem(LS_FORM_SUBMITTED);

              paymentDataRef.current = {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              };

              setStep("form");
            } else {
              alert("Payment validation failed. Please contact support.");
              setStep("video");
            }
          } catch (err) {
            console.error("Validation error:", err);
            alert(
              `Payment was received but validation failed. Your Payment ID: ${response.razorpay_payment_id}. Please contact support.`
            );
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setStep("video");
          },
        },
        theme: { color: "#1593a1" },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", (response) => {
        alert(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
        setStep("video");
      });

      paymentObject.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong while initiating payment. Please try again.");
      setIsProcessing(false);
      setStep("video");
    }
  }, [loadRazorpay]);

  // ── Form validation ────────────────────────────────────────────────────
  const validateForm = useCallback(() => {
    const errors = {};

    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      errors.phone = "Enter a valid 10-digit Indian phone number";
    }
    if (!form.college.trim()) errors.college = "College of interest is required";
    if (!form.branch.trim()) errors.branch = "Branch of interest is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  // ── Form submission ────────────────────────────────────────────────────
  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      setIsSubmitting(true);

      try {
        const res = await fetch(`${BASE_URL}/api/tti/submit-form`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            college: form.college.trim(),
            branch: form.branch.trim(),
            queries: form.queries.trim() || "",
            razorpay_payment_id: paymentDataRef.current.paymentId,
            razorpay_order_id: paymentDataRef.current.orderId,
          }),
        });

        const data = await res.json();

        if (data.success || res.status === 409) {
          // 409 = already submitted, still show success
          localStorage.setItem(LS_FORM_SUBMITTED, "true");
          setStep("confirmation");
        } else {
          alert(data.error || "Failed to submit. Please try again.");
        }
      } catch (err) {
        console.error("Form submit error:", err);
        alert("Network error. Please check your connection and try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, validateForm]
  );

  // ── Handle input change ────────────────────────────────────────────────
  const handleInputChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error on change
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ── Warning modal handlers ─────────────────────────────────────────────
  const handleStayOnForm = () => setShowBackWarning(false);

  const handleLeaveForm = () => {
    setShowBackWarning(false);
    // We don't clear localStorage — user can come back and resume
    setStep("landing");
  };

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  return (
    <main className="talk-to-iitian-page">
      <Helmet>
        <title>Talk to IITians | 1-on-1 Mentorship with IIT Students — CollegeMap</title>
        <meta name="description" content="Book a 1-on-1 session with a current IIT student. Get personalized advice on JEE strategy, college selection, branch choices, campus life, and placements." />
        <link rel="canonical" href="https://collegemap.in/TalkToIITians" />
      </Helmet>
      <section className="tti-layout">
        <p className="tti-page-label">Talk to IITians</p>

        <ProgressBar currentStep={step} />

        {/* 1: Landing */}
        {step === "landing" && (
          <div className="tti-step-container" key="landing">
            <div className="tti-hero-section">
              <div className="tti-hero-content">
                <h1 className="tti-title">
                  Don't Guess.<br />
                  <span>Talk to an IITian.</span>
                </h1>
                <ul className="tti-list">
                  <li>Select a college & branch</li>
                  <li>Connect with CollegeMap</li>
                  <li>Find college students to clear all doubts</li>
                </ul>
                <button
                  className="tti-hero-start-btn"
                  onClick={() => setStep("video")}
                >
                  Start Now
                </button>
              </div>
              <div className="tti-hero-visual">
                {/* <img
                  src="/talktoiitians.png"
                  alt="Talk to IITians - 1:1 Mentorship"
                  className="tti-visual-img"
                /> */}
                <video
                  src="/tti_videoclip.mp4"
                  className="tti-visual-img"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                />
              </div>
            </div>

            <div className="tti-middle-section">
              <h2 className="tti-middle-heading">
                Before spending <span>lakhs</span> on your college,<br />
                this is the perfect <span>final check</span> — <span className="tti-mobile-break"></span>@ ₹500
              </h2>

              <div className="tti-steps-container">
                <div className="tti-step">
                  <p className="tti-step-title">Tell us your goal</p>
                  <p className="tti-step-desc">
                    Share your <strong>dream college & branch</strong> with us
                  </p>
                </div>

                <div className="tti-step-arrow">→</div>

                <div className="tti-step">
                  <p className="tti-step-title">We find your match</p>
                  <p className="tti-step-desc">
                    We connect you with a <strong>student who took that exact course</strong>
                  </p>
                </div>

                <div className="tti-step-arrow">→</div>

                <div className="tti-step">
                  <p className="tti-step-title">Personal meeting</p>
                  <p className="tti-step-desc">
                    Ask all your doubts & <strong>take the final call with confidence</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2: Video Demo */}
        {step === "video" && (
          <div className="tti-step-container tti-video-step" key="video">
            <div className="tti-video-header">
              <p>Watch this quick demo to understand the process before proceeding</p>
            </div>

            <div className="tti-video-container">
              {/* Replace the src below with your actual MP4 video path */}
              <video
                src="/tti_videoclip.mp4"
                controls
                autoPlay
                muted
                playsInline
                preload="auto"
              >
              </video>
            </div>
          </div>
        )}

        {/* 3: Payment */}
        {step === "payment" && (
          <div className="tti-step-container tti-payment-step" key="payment">
            <div className="tti-payment-card">
              <div className="tti-payment-icon">🎓</div>
              <h2>1:1 Mentorship Session</h2>
              <div className="tti-payment-amount">₹500</div>
              <p className="tti-payment-desc">
                One-time payment for a personal meeting with a student from your dream college
              </p>

              <ul className="tti-payment-features">
                <li>
                  <span className="feature-check">✓</span>
                  Matched with a student from your exact college & branch
                </li>
                <li>
                  <span className="feature-check">✓</span>
                  Ask unlimited questions about campus life, placements & more
                </li>
                <li>
                  <span className="feature-check">✓</span>
                  Get honest, first-hand insights to make the right decision
                </li>
              </ul>

              <button
                className={`tti-pay-btn ${isProcessing ? "processing" : ""}`}
                onClick={handlePayment}
                disabled={isProcessing}
                id="tti-pay-now"
              >
                {isProcessing ? (
                  <>
                    <span className="tti-spinner"></span>
                    Processing...
                  </>
                ) : (
                  "Pay ₹500 Securely"
                )}
              </button>

              <button
                className="tti-back-link"
                onClick={() => {
                  setIsProcessing(false);
                  setStep("video");
                }}
                disabled={isProcessing}
              >
                ← Back to video
              </button>
            </div>
          </div>
        )}

        {/* 4: Form*/}
        {step === "form" && (
          <div className="tti-step-container tti-form-step" key="form">
            <div className="tti-form-header">
              <h2>Almost There!</h2>
              <p>Fill in your details so we can connect you with the right mentor</p>
              <div className="tti-payment-badge">
                Payment Confirmed
              </div>
            </div>

            {isRecovery && (
              <div className="tti-recovery-banner">
                <span className="recovery-text">
                  We detected an incomplete form from a previous session. Your payment is already confirmed — just fill in the details below.
                </span>
              </div>
            )}

            <div className="tti-form-card">
              <form onSubmit={handleFormSubmit} noValidate>
                {/* Name */}
                <div className="tti-form-group">
                  <label htmlFor="tti-name">
                    Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="tti-name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleInputChange("name")}
                    className={formErrors.name ? "error" : ""}
                    autoFocus
                  />
                  {formErrors.name && (
                    <div className="tti-field-error">⚠ {formErrors.name}</div>
                  )}
                </div>

                {/* Phone */}
                <div className="tti-form-group">
                  <label htmlFor="tti-phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="tti-phone"
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={handleInputChange("phone")}
                    className={formErrors.phone ? "error" : ""}
                    maxLength={10}
                  />
                  {formErrors.phone && (
                    <div className="tti-field-error">⚠ {formErrors.phone}</div>
                  )}
                </div>

                {/* College of Interest */}
                <div className="tti-form-group">
                  <label htmlFor="tti-college">
                    College of Interest <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="tti-college"
                    placeholder="e.g., IIT Bombay, NIT Trichy"
                    value={form.college}
                    onChange={handleInputChange("college")}
                    className={formErrors.college ? "error" : ""}
                  />
                  {formErrors.college && (
                    <div className="tti-field-error">⚠ {formErrors.college}</div>
                  )}
                </div>

                {/* Branch of Interest */}
                <div className="tti-form-group">
                  <label htmlFor="tti-branch">
                    Branch of Interest <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="tti-branch"
                    placeholder="e.g., Computer Science, Electrical"
                    value={form.branch}
                    onChange={handleInputChange("branch")}
                    className={formErrors.branch ? "error" : ""}
                  />
                  {formErrors.branch && (
                    <div className="tti-field-error">⚠ {formErrors.branch}</div>
                  )}
                </div>

                {/* Specific Queries */}
                <div className="tti-form-group">
                  <label htmlFor="tti-queries">
                    Any Specific Queries
                  </label>
                  <textarea
                    id="tti-queries"
                    placeholder="Tell us anything specific you want to know about the college, branch, placements, campus life..."
                    value={form.queries}
                    onChange={handleInputChange("queries")}
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  className={`tti-submit-btn ${isSubmitting ? "loading" : ""}`}
                  disabled={isSubmitting}
                  id="tti-submit-form"
                >
                  {isSubmitting ? (
                    <>
                      <span className="tti-spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    "Submit Details"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 5: Confirmation */}
        {step === "confirmation" && (
          <div className="tti-step-container tti-confirmation-step" key="confirmation">
            <div className="tti-success-card">
              <div className="tti-success-checkmark">
                <svg viewBox="0 0 24 24">
                  <polyline points="6 12 10 16 18 8" />
                </svg>
              </div>

              <h2>You're All Set!</h2>

              <p className="tti-success-msg">
                Thank you for choosing CollegeMap!<br />
                We'll reach out to you on <strong>WhatsApp</strong> very soon to schedule your 1:1 mentorship session.
              </p>

              <div className="tti-whatsapp-badge">
                <svg viewBox="0 0 24 24" fill="#166534">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Expect a WhatsApp message shortly
              </div>

              <div className="tti-success-details">
                <p><strong>Payment ID:</strong> {paymentDataRef.current.paymentId}</p>
                <p>Save this for your records</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/*  Persistent Fixed Bottom Bar */}
      {step !== "confirmation" && (
        <div className="tti-fixed-bottom-bar">
          <div className="tti-fixed-bar-content">
            <div className="tti-fixed-text">
              <span>Make payment</span>
              <span className="tti-arrow">→</span>
              <span>Inquire on WhatsApp</span>
              <span className="tti-arrow">→</span>
              <span>Personal meeting</span>
            </div>
            <button
              className="tti-start-now-btn"
              onClick={() => {
                if (step === "landing") setStep("video");
                else if (step === "video") setStep("payment");
                else if (step === "payment") handlePayment();
                else if (step === "form") {
                  // Trigger the form's submit programmatically
                  document.getElementById("tti-submit-form")?.click();
                }
              }}
              disabled={isProcessing || isSubmitting}
              id="tti-bottom-cta"
            >
              {step === "landing" && "Start Now"}
              {step === "video" && "Continue to Payment"}
              {step === "payment" && (isProcessing ? "Processing..." : "Pay ₹500")}
              {step === "form" && (isSubmitting ? "Submitting..." : "Submit Details")}
            </button>
          </div>
        </div>
      )}

      {/* Back Warning Modal */}
      {showBackWarning && (
        <div className="tti-warning-overlay" onClick={handleStayOnForm}>
          <div className="tti-warning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tti-warning-icon">⚠️</div>
            <h3>Don't leave yet!</h3>
            <p>
              Your payment is confirmed but you haven't submitted your details yet.
              We won't be able to reach out to you without this information.
            </p>
            <div className="tti-warning-actions">
              <button className="tti-warning-stay" onClick={handleStayOnForm} id="tti-warning-stay">
                Fill the Form
              </button>
              <button className="tti-warning-leave" onClick={handleLeaveForm} id="tti-warning-leave">
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TalkToIITian;