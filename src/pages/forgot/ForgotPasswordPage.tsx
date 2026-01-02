// src/pages/forgot/ForgotPasswordPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../lib/auth/useAuth";
import { firebaseErrorMessage } from "../../services/firebaseErrorMessage";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import styles from "./ForgotPasswordPage.module.scss";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email.");
      return;
    }

    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      toast.success("Reset email sent. Check your inbox.");
    } catch (err) {
      toast.error(firebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout variant="centered">
      <div className={styles.card}>
        <div className={styles.header}>
          <img className={styles.headerLogo} src="/navbar-logo-plansave.png" alt="Plansave logo" />
          <h1 className={styles.title}>Forgot password?</h1>
          <p className={styles.subtitle}>No worries, we’ll send you reset instructions.</p>
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
                className={`input ${error ? styles.inputError : ""}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
              />
            </div>
            {error ? <div className={styles.errorText}>{error}</div> : null}
          </div>

          <button className={styles.primaryBtn} type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </button>

          <Link className={styles.backLink} to="/login">
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to login</span>
          </Link>
        </form>
      </div>
    </AuthSplitLayout>
  );
}