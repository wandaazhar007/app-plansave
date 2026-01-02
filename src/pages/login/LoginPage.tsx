// src/pages/login/LoginPage.tsx
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../lib/auth/useAuth";
import { firebaseErrorMessage } from "../../services/firebaseErrorMessage";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import styles from "./LoginPage.module.scss";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from ?? "/app/dashboard";
  }, [location.state]);

  function validate() {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Please enter a valid email.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 6) next.password = "Password must be at least 8 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back. You’re on track.");
      navigate(redirectTo, { replace: true });
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
      toast.success("Signed in. Small steps—keep going.");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(firebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      leftTitle="Plansave"
      leftSubtitle="Take control with calm clarity—track spending and dialysis costs, set budgets, and stay on track without judgment."
    >
      <div className={styles.card}>
        <div className={styles.header}>
          <img className={styles.headerLogo} src="/navbar-logo-plansave.png" alt="Plansave logo" />
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to continue tracking your expenses</p>
        </div>

        <button
          type="button"
          className={styles.googleBtn}
          onClick={onGoogle}
          disabled={submitting}
        >
          <img className={styles.googleIcon} src="/google-logo.png" alt="" />
          <span>Continue with Google</span>
        </button>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or continue with email</span>
          <span className={styles.dividerLine} />
        </div>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
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
                placeholder="youremail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
            </div>

            {errors.email ? <div className={styles.errorText}>{errors.email}</div> : null}
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="password">Password</label>
              <Link className={styles.forgot} to="/forgot">Forgot password?</Link>
            </div>

            <div className={styles.inputWrap}>
              <span className={styles.leftIcon} aria-hidden="true">
                <FontAwesomeIcon icon={faLock} />
              </span>

              <input
                id="password"
                className={`input ${errors.password ? styles.inputError : ""}`}
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
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

            {errors.password ? <div className={styles.errorText}>{errors.password}</div> : null}
          </div>

          <button className={styles.primaryBtn} type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className={styles.bottomText}>
            Don&apos;t have an account?{" "}
            <Link className={styles.bottomLink} to="/signup">Sign up for free</Link>
          </p>
        </form>
      </div>
    </AuthSplitLayout>
  );
}