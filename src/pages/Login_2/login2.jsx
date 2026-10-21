import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "../../context/UserProfileContext";
import { saveUserProfile, getUserProfile } from "../../services/supabaseService";
import "./login2.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_MIN = 10;
const PHONE_DIGITS_MAX = 15;

const normalizePhone = (value) => value.replace(/\D/g, "");

const getAuthRedirectUrl = () => {
	const explicitUrl = (process.env.REACT_APP_AUTH_REDIRECT_URL || "").trim();
	if (explicitUrl) return explicitUrl;
	const base = window.location.origin;
	return `${base.replace(/\/+$/, "")}/login`;
};

const getFriendlyError = (message) => {
	if (!message) return "Unable to sign in. Please try again.";
	const normalized = message.toLowerCase();

	if (normalized.includes("invalid login credentials")) {
		return "Invalid email or password.";
	}

	if (normalized.includes("email not confirmed")) {
		return "Please confirm your email before logging in.";
	}

	if (normalized.includes("network")) {
		return "Network issue detected. Please check your connection.";
	}

	if (normalized.includes("user already registered")) {
		return "This email is already registered. Please sign in instead.";
	}

	return message;
};

const isEmailNotConfirmedError = (message) => {
	return (message || "").toLowerCase().includes("email not confirmed");
};

const Login2 = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { login } = useAuth();
	const { setProfile } = useUserProfile();

	const [email, setEmail] = useState("");
	const [fullName, setFullName] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [authMode, setAuthMode] = useState("signin");
	const [canResendVerification, setCanResendVerification] = useState(false);
	const [resendingVerification, setResendingVerification] = useState(false);
	const [forgotMode, setForgotMode] = useState(false);
	const [recoveryMode, setRecoveryMode] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");

	const redirectTo = useMemo(() => {
		return location.state?.redirectTo || "/";
	}, [location.state]);

	const authRedirectUrl = useMemo(() => getAuthRedirectUrl(), []);

	useEffect(() => {
		const hash = location.hash || window.location.hash;
		if (!hash) return;

		const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
		if (params.get("type") === "recovery") {
			setRecoveryMode(true);
			setForgotMode(false);
			setAuthMode("signin");
			setError("");
			setNotice("Enter a new password to complete your reset.");
		}
	}, [location.hash]);

	const validateForm = () => {
		if (!email.trim() || !password.trim()) {
			setError("Please enter both email and password.");
			return false;
		}

		if (authMode === "signup" && fullName.trim().length < 2) {
			setError("Please enter your full name.");
			return false;
		}

		if (authMode === "signup") {
			const normalizedPhone = normalizePhone(phone);
			if (normalizedPhone.length < PHONE_DIGITS_MIN || normalizedPhone.length > PHONE_DIGITS_MAX) {
				setError("Please enter a valid phone number.");
				return false;
			}
		}

		if (!emailPattern.test(email.trim())) {
			setError("Please enter a valid email address.");
			return false;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters.");
			return false;
		}

		if (authMode === "signup" && password !== confirmPassword) {
			setError("Password and confirm password do not match.");
			return false;
		}

		return true;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setNotice("");
		setCanResendVerification(false);

		if (!supabase) {
			setError("Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.");
			return;
		}

		if (!validateForm()) {
			return;
		}

		setLoading(true);

		try {
			if (authMode === "signin") {
				const { data, error: signInError } = await supabase.auth.signInWithPassword({
					email: email.trim().toLowerCase(),
					password,
				});

				if (signInError) {
					if (isEmailNotConfirmedError(signInError.message)) {
						setCanResendVerification(true);
					}
					setError(getFriendlyError(signInError.message));
					return;
				}

				const accessToken = data?.session?.access_token;
				const currentUser = data?.user;

				if (!accessToken || !currentUser) {
					setError("Login succeeded but session data is missing. Please sign in again.");
					return;
				}

				const userData = {
					token: accessToken,
					email: currentUser.email,
					id: currentUser.id,
				};

				login(userData);

				if (currentUser.email) {
					sessionStorage.setItem("userEmail", currentUser.email);
				}

				// Fetch user profile from users table and populate context (cached)
				const profile = await getUserProfile(currentUser.email);
				if (profile) {
					setProfile(profile);
				} else {
					// Fallback: build profile from Supabase Auth metadata
					const meta = currentUser.user_metadata || {};
					const fallbackProfile = {
						email: currentUser.email,
						name: meta.display_name || meta.name || meta.full_name || '',
						phone: meta.phone_number || meta.phone || '',
					};
					if (fallbackProfile.name) {
						setProfile(fallbackProfile);
					}
				}

				navigate(redirectTo, { replace: true });
				return;
			}

			const normalizedSignupPhone = normalizePhone(phone);

			const { data, error: signUpError } = await supabase.auth.signUp({
				email: email.trim().toLowerCase(),
				password,
				options: {
					emailRedirectTo: authRedirectUrl,
					data: {
						display_name: fullName.trim(),
						name: fullName.trim(),
						full_name: fullName.trim(),
						phone_number: normalizedSignupPhone,
						phone: normalizedSignupPhone,
					},
				},
			});

			if (signUpError) {
				setError(getFriendlyError(signUpError.message));
				return;
			}

			// Save user details to the users table
			const savedProfile = await saveUserProfile({
				name: fullName.trim(),
				email: email.trim().toLowerCase(),
				phone: normalizedSignupPhone,
			});
			if (savedProfile) {
				setProfile(savedProfile);
			}

			if (data?.session?.access_token && data?.user) {
				const userData = {
					token: data.session.access_token,
					email: data.user.email,
					id: data.user.id,
					name: fullName.trim(),
					phone: normalizedSignupPhone,
				};
				login(userData);
				if (data.user.email) {
					sessionStorage.setItem("userEmail", data.user.email);
				}
				navigate(redirectTo, { replace: true });
				return;
			}

			setNotice("Registration successful. Please verify your email, then sign in.");
			setAuthMode("signin");
			setCanResendVerification(true);
			setFullName("");
			setPhone("");
			setPassword("");
			setConfirmPassword("");
		} catch (err) {
			setError(getFriendlyError(err?.message));
		} finally {
			setLoading(false);
		}
	};

	const handleResendVerification = async () => {
		setError("");
		setNotice("");

		if (!supabase) {
			setError("Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.");
			return;
		}

		if (!emailPattern.test(email.trim())) {
			setError("Enter a valid email to resend verification.");
			return;
		}

		setResendingVerification(true);

		try {
			const { error: resendError } = await supabase.auth.resend({
				type: "signup",
				email: email.trim().toLowerCase(),
				options: {
					emailRedirectTo: authRedirectUrl,
				},
			});

			if (resendError) {
				setError(getFriendlyError(resendError.message));
				return;
			}

			setNotice("Verification email sent again. Please check inbox and spam folders.");
		} catch (err) {
			setError(getFriendlyError(err?.message));
		} finally {
			setResendingVerification(false);
		}
	};

	const openForgotPassword = () => {
		setForgotMode(true);
		setRecoveryMode(false);
		setError("");
		setNotice("");
		setCanResendVerification(false);
	};

	const closeForgotPassword = () => {
		setForgotMode(false);
		setError("");
		setNotice("");
	};

	const handleForgotPassword = async (event) => {
		event.preventDefault();
		setError("");
		setNotice("");

		if (!supabase) {
			setError("Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.");
			return;
		}

		if (!emailPattern.test(email.trim())) {
			setError("Enter a valid email to receive the reset link.");
			return;
		}

		setLoading(true);
		try {
			const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
				redirectTo: authRedirectUrl,
			});

			if (resetError) {
				setError(getFriendlyError(resetError.message));
				return;
			}

			setNotice("Password reset link sent. Check inbox and spam folders.");
		} catch (err) {
			setError(getFriendlyError(err?.message));
		} finally {
			setLoading(false);
		}
	};

	const handleRecoveryPasswordUpdate = async (event) => {
		event.preventDefault();
		setError("");
		setNotice("");

		if (!supabase) {
			setError("Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.");
			return;
		}

		if (newPassword.length < 6) {
			setError("New password must be at least 6 characters.");
			return;
		}

		if (newPassword !== confirmNewPassword) {
			setError("New password and confirm password do not match.");
			return;
		}

		setLoading(true);
		try {
			const { error: updateError } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (updateError) {
				setError(getFriendlyError(updateError.message));
				return;
			}

			await supabase.auth.signOut();
			setRecoveryMode(false);
			setNewPassword("");
			setConfirmNewPassword("");
			setShowPassword(false);
			setNotice("Password updated successfully. Please sign in with your new password.");

			if (window.location.hash) {
				window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
			}
		} catch (err) {
			setError(getFriendlyError(err?.message));
		} finally {
			setLoading(false);
		}
	};

	const switchMode = (mode) => {
		setAuthMode(mode);
		setError("");
		setNotice("");
		setForgotMode(false);
		setRecoveryMode(false);
		setCanResendVerification(false);
		setFullName("");
		setPhone("");
		setPassword("");
		setConfirmPassword("");
		setNewPassword("");
		setConfirmNewPassword("");
	};

	return (
		<section className="login2-page">
			<div className="login2-shell">
				<div className="login2-brand">
					<p className="login2-eyebrow">CollegeMap Access</p>
					<h1>{authMode === "signin" ? "Welcome back" : "Create your account"}</h1>
					<p>
						{authMode === "signin"
							? "Sign in to your CollegeMap account to continue your preparation."
							: "Register with your email and password to start using CollegeMap."}
					</p>
					<ul className="login2-points">
						<li>Track your progress and saved activities</li>
						<li>Access premium tools and dashboards</li>
						<li>Continue from where you left off</li>
					</ul>
				</div>

				<div className="login2-card">
					<div className="login2-switch" role="tablist" aria-label="Authentication Mode">
						<button
							type="button"
							className={`login2-switch-btn ${authMode === "signin" ? "active" : ""}`}
							onClick={() => switchMode("signin")}
						>
							Sign in
						</button>
						<button
							type="button"
							className={`login2-switch-btn ${authMode === "signup" ? "active" : ""}`}
							onClick={() => switchMode("signup")}
						>
							Create account
						</button>
					</div>

					<h2>
						{recoveryMode
							? "Reset password"
							: forgotMode
								? "Forgot password"
								: authMode === "signin"
									? "Sign in"
									: "Register"}
					</h2>
					<p className="login2-subtitle">
						{recoveryMode
							? "Set your new password below."
							: forgotMode
								? "Enter your email to receive a reset link."
								: authMode === "signin"
									? "Use your registered email and password."
									: "Create your account with email and password."}
					</p>

					{error ? <p className="login2-error">{error}</p> : null}
					{canResendVerification && authMode === "signin" ? (
						<div className="login2-resend-wrap">
							<button
								type="button"
								className="login2-resend-btn"
								onClick={handleResendVerification}
								disabled={loading || resendingVerification}
							>
								{resendingVerification ? "Sending verification email..." : "Resend verification email"}
							</button>
						</div>
					) : null}
					{notice ? <p className="login2-notice">{notice}</p> : null}

					{recoveryMode ? (
						<form onSubmit={handleRecoveryPasswordUpdate} className="login2-form" noValidate>
							<label htmlFor="login2-new-password">New password</label>
							<div className="login2-password-wrap">
								<input
									id="login2-new-password"
									type={showPassword ? "text" : "password"}
									value={newPassword}
									onChange={(event) => setNewPassword(event.target.value)}
									placeholder="Enter new password"
									autoComplete="new-password"
									disabled={loading}
								/>
								<button
									className="login2-toggle"
									type="button"
									onClick={() => setShowPassword((prev) => !prev)}
									disabled={loading}
								>
									{showPassword ? "Hide" : "Show"}
								</button>
							</div>

							<label htmlFor="login2-confirm-new-password">Confirm new password</label>
							<input
								id="login2-confirm-new-password"
								type={showPassword ? "text" : "password"}
								value={confirmNewPassword}
								onChange={(event) => setConfirmNewPassword(event.target.value)}
								placeholder="Re-enter new password"
								autoComplete="new-password"
								disabled={loading}
							/>

							<button className="login2-submit" type="submit" disabled={loading}>
								{loading ? "Updating password..." : "Update password"}
							</button>
						</form>
					) : forgotMode ? (
						<form onSubmit={handleForgotPassword} className="login2-form" noValidate>
							<label htmlFor="login2-email">Email</label>
							<input
								id="login2-email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="name@example.com"
								autoComplete="email"
								disabled={loading}
							/>

							<button className="login2-submit" type="submit" disabled={loading}>
								{loading ? "Sending reset link..." : "Send reset link"}
							</button>

							<button className="login2-inline-link" type="button" onClick={closeForgotPassword}>
								Back to sign in
							</button>
						</form>
					) : (
						<form onSubmit={handleSubmit} className="login2-form" noValidate>
							<label htmlFor="login2-email">Email</label>
							<input
								id="login2-email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="name@example.com"
								autoComplete="email"
								disabled={loading}
							/>

							{authMode === "signup" ? (
								<>
									<label htmlFor="login2-full-name">Full name</label>
									<input
										id="login2-full-name"
										type="text"
										value={fullName}
										onChange={(event) => setFullName(event.target.value)}
										placeholder="Enter your full name"
										autoComplete="name"
										disabled={loading}
									/>

									<label htmlFor="login2-phone">Phone</label>
									<input
										id="login2-phone"
										type="tel"
										value={phone}
										onChange={(event) => setPhone(event.target.value.replace(/[^\d+\-\s()]/g, ""))}
										placeholder="Enter your phone number"
										autoComplete="tel"
										disabled={loading}
									/>
								</>
							) : null}

							<div className="login2-field-head">
								<label htmlFor="login2-password">Password</label>
								{authMode === "signin" ? (
									<button className="login2-inline-link" type="button" onClick={openForgotPassword}>
										Forgot password?
									</button>
								) : null}
							</div>
							<div className="login2-password-wrap">
								<input
									id="login2-password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									placeholder="Enter your password"
									autoComplete="current-password"
									disabled={loading}
								/>
								<button
									className="login2-toggle"
									type="button"
									onClick={() => setShowPassword((prev) => !prev)}
									disabled={loading}
								>
									{showPassword ? "Hide" : "Show"}
								</button>
							</div>

							{authMode === "signup" ? (
								<>
									<label htmlFor="login2-confirm-password">Confirm password</label>
									<input
										id="login2-confirm-password"
										type={showPassword ? "text" : "password"}
										value={confirmPassword}
										onChange={(event) => setConfirmPassword(event.target.value)}
										placeholder="Re-enter your password"
										autoComplete="new-password"
										disabled={loading}
									/>
								</>
							) : null}

							<button className="login2-submit" type="submit" disabled={loading}>
								{loading
									? authMode === "signin"
										? "Signing in..."
										: "Creating account..."
									: authMode === "signin"
										? "Sign in"
										: "Create account"}
							</button>
						</form>
					)}
				</div>
			</div>
		</section>
	);
};

export default Login2;
