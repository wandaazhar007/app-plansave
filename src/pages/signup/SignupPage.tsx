// src/pages/signup/SignupPage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../lib/auth/useAuth";
import { firebaseErrorMessage } from "../../services/firebaseErrorMessage";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import styles from "./SignupPage.module.scss";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});

  function validate() {
    const next: typeof errors = {};

    if (!name.trim()) next.name = "Full name is required.";
    else if (name.trim().length < 2) next.name = "Please enter your full name.";

    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Please enter a valid email.";

    if (!password) next.password = "Password is required.";
    else if (password.length < 8) next.password = "Must be at least 8 characters.";

    if (!confirm) next.confirm = "Please confirm your password.";
    else if (confirm !== password) next.confirm = "Passwords do not match.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password });
      toast.success("Account created. You’re on track.");
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      toast.error(firebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success("Account ready. One step at a time.");
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      toast.error(firebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      leftTitle="Plansave"
      leftSubtitle="Start with clarity—set budgets, track daily spending and dialysis costs, and make steady progress without stress."
    >
      <div className={styles.card}>
        <div className={styles.header}>
          <img className={styles.headerLogo} src="/navbar-logo-plansave.png" alt="Plansave logo" />
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Start tracking your expenses in seconds</p>
        </div>

        <button type="button" className={styles.googleBtn} onClick={onGoogle} disabled={submitting}>
          <img className={styles.googleIcon} src="/google-logo.png" alt="" />
          <span>Continue with Google</span>
        </button>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or sign up with email</span>
          <span className={styles.dividerLine} />
        </div>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">Full name</label>
            <div className={styles.inputWrap}>
              <span className={styles.leftIcon} aria-hidden="true">
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                id="name"
                className={`input ${errors.name ? styles.inputError : ""}`}
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
            </div>
            {errors.name ? <div className={styles.errorText}>{errors.name}</div> : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email address</label>
            <div className={styles.inputWrap}>
              <span className={styles.leftIcon} aria-hidden="true">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input
                id="email"
                className={`input ${errors.email ? styles.inputError : ""}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email ? <div className={styles.errorText}>{errors.email}</div> : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <div className={styles.inputWrap}>
              <span className={styles.leftIcon} aria-hidden="true">
                <FontAwesomeIcon icon={faLock} />
              </span>

              <input
                id="password"
                className={`input ${errors.password ? styles.inputError : ""}`}
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
              />

              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
              </button>
            </div>

            <div className={styles.hint}>Must be at least 8 characters</div>
            {errors.password ? <div className={styles.errorText}>{errors.password}</div> : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm">Confirm password</label>
            <div className={styles.inputWrap}>
              <span className={styles.leftIcon} aria-hidden="true">
                <FontAwesomeIcon icon={faLock} />
              </span>

              <input
                id="confirm"
                className={`input ${errors.confirm ? styles.inputError : ""}`}
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={!!errors.confirm}
              />

              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} />
              </button>
            </div>

            {errors.confirm ? <div className={styles.errorText}>{errors.confirm}</div> : null}
          </div>

          <button className={styles.primaryBtn} type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </button>

          <p className={styles.terms}>
            By signing up, you agree to our{" "}
            <a className={styles.inlineLink} href="https://plansave.com/terms" target="_blank" rel="noreferrer">
              Terms of Service
            </a>{" "}
            and{" "}
            <a className={styles.inlineLink} href="https://plansave.com/privacy" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
            .
          </p>

          <p className={styles.bottomText}>
            Already have an account?{" "}
            <Link className={styles.bottomLink} to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </AuthSplitLayout>
  );
}