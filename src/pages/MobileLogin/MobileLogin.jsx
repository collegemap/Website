import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./MobileLogin.scss";
import CollegeIllustration from "../../assets/college-illustration.svg";

const MobileLogin = () => {
    const [mobileNumber, setMobileNumber] = useState("");
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const otpRefs = useRef([]);
    const { isLoggedIn, login, logout } = useAuth();
    const [resendTimer, setResendTimer] = useState(null);
    const [resendActive, setResendActive] = useState(false);
    const RESEND_DELAY = 120;
    const [resendCounter, setResendCounter] = useState(RESEND_DELAY);

    // dev mode bypass useefect
    // useEffect(() => {
    //     if (process.env.NODE_ENV === "development") {
    //         const dummyToken = "auto-dev-token";
    //         localStorage.setItem("authToken", dummyToken);
    //         login(dummyToken);
    //         navigate("/Questionaire");
    //     }
    // }, []);

    useEffect(() => {
        if (otpSent) {
            startResendTimer();
        } else {
            clearResendTimer();
            setResendActive(false);
            setResendCounter(RESEND_DELAY);
        }
    }, [otpSent]);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const expiry = payload.exp * 1000;
            const now = Date.now();

            if (expiry < now) {
                logout();
                navigate("/login", { replace: true });
            } else {
                const timeout = setTimeout(() => {
                    logout();
                    navigate("/login", { replace: true });
                }, expiry - now);
                return () => clearTimeout(timeout);
            }
        }
    }, []);


    const startResendTimer = () => {
        setResendActive(false);
        setResendCounter(RESEND_DELAY);
        const timer = setInterval(() => {
            setResendCounter((prevCounter) => {
                if (prevCounter <= 1) {
                    clearInterval(timer);
                    setResendActive(true);
                    return 0;
                }
                return prevCounter - 1;
            });
        }, 1000);
        setResendTimer(timer);
    };

    const clearResendTimer = () => {
        if (resendTimer) {
            clearInterval(resendTimer);
            setResendTimer(null);
        }
    };

    const handleMobileChange = (e) => {
        const input = e.target.value.replace(/\D/g, "").slice(0, 10);
        setMobileNumber(input);
        if (input.length === 10) setError("");
    };

    const sendOtp = async () => {
        const validIndianMobile = /^[6-9]\d{9}$/;

        if (!validIndianMobile.test(mobileNumber)) {
            setError("Please enter a valid Indian mobile number.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/sessions/send_verification_code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile_number: mobileNumber }),
                credentials: "include",
            });

            if (response.ok) {
                setOtpSent(true);
                setError("");
            } else {
                const errorData = await response.json();
                setError(errorData?.message || "Failed to send OTP. Please try again.");
            }
        } catch {
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };



    const handleResendOtp = () => {
        if (resendActive) {
            setLoading(true);
            setResendActive(false);
            setResendCounter(RESEND_DELAY);
            sendOtp();
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const updatedOtp = [...otp];
        updatedOtp[index] = value;
        setOtp(updatedOtp);

        if (value && index < otpRefs.current.length - 1) {
            otpRefs.current[index + 1]?.focus();
        }
    };
    const verifyOtp = async () => {
        const enteredOtp = otp.map((digit) => digit.trim()).join("");
        const redirectTo = location.state?.redirectTo;

        if (enteredOtp.length !== 4 || /\D/.test(enteredOtp)) {
            setError("Please enter a valid 4-digit OTP.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile_number: mobileNumber, otp: enteredOtp }),
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("authToken", data.token);
                login({ token: data.token });


                if (redirectTo === "/EnhancedQuestions") {
                    navigate(redirectTo);
                } else if (redirectTo) {
                    navigate(redirectTo);
                } else {
                    navigate("/Questionaire");
                }

            } else {
                setError(data?.message || "Incorrect OTP. Please try again.");
                setOtp(["", "", "", ""]);
                otpRefs.current[0]?.focus();
            }
        } catch (error) {
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="mobile-login-container fade-in">
            <div className="illustration">
                <img src={CollegeIllustration} alt="College themed login" />
            </div>
            <div className="login-box">
                <h2>Welcome to CollegeMap</h2>
                <p className="subtext">Log in to access your Advanced college list.</p>
                {error && <p className="error-message">{error}</p>}

                {!otpSent ? (
                    <>
                        <input
                            type="tel"
                            className="input-field"
                            placeholder="Enter your 10-digit mobile number"
                            value={mobileNumber}
                            onChange={handleMobileChange}
                        />
                        <button className="button send-otp" onClick={sendOtp} disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </>
                ) : (
                    <>
                        <p>Enter the OTP sent to {mobileNumber}</p>
                        <div className="otp-container">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { if (el) otpRefs.current[index] = el; }}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Backspace" && !otp[index] && index > 0) {
                                            otpRefs.current[index - 1]?.focus();
                                        }
                                    }}
                                />
                            ))}
                        </div>
                        <button className="button verify-otp" onClick={verifyOtp} disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                        <div className="resend-otp-container">
                            {!resendActive ? (
                                <p>Resend OTP in {resendCounter} seconds</p>
                            ) : (
                                <button className="resend-otp-button" onClick={handleResendOtp} disabled={loading}>
                                    {loading ? "Resending..." : "Resend OTP"}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MobileLogin;