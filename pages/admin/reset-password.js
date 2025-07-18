import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import styles from "../../styles/AdminLogin.module.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [token, setToken] = useState("");
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (router.query.token) {
      setToken(router.query.token);
      // Validate token
      validateToken(router.query.token);
    }
  }, [router.query.token]);

  const validateToken = async (resetToken) => {
    try {
      const response = await fetch("/api/admin/validate-reset-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: resetToken }),
      });

      if (response.ok) {
        setValidToken(true);
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    } catch (err) {
      setError("Failed to validate reset link.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess("Password reset successfully! Redirecting to login page...");
      setPassword("");
      setConfirmPassword("");

      // Start countdown and redirect
      setCountdown(2);
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push("/admin/login");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div className={styles.logoContainer}>
            <Image
              src="/logo.svg"
              alt="UHP Canteen Logo"
              width={120}
              height={54}
              className={styles.logo}
            />
          </div>
          <h1>Reset Password</h1>
          <div className={styles.error}>Invalid reset link.</div>
          <div className={styles.forgotPassword}>
            <Link href="/admin/forgot-password">Request new reset link</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!validToken && !error) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div className={styles.logoContainer}>
            <Image
              src="/logo.svg"
              alt="UHP Canteen Logo"
              width={120}
              height={54}
              className={styles.logo}
            />
          </div>
          <h1>Reset Password</h1>
          <div className={styles.description}>Validating reset link...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <Image
            src="/logo.svg"
            alt="UHP Canteen Logo"
            width={120}
            height={54}
            className={styles.logo}
          />
        </div>
        <h1>Reset Password</h1>
        <p className={styles.description}>Enter your new password below.</p>

        {error && <div className={styles.error}>{error}</div>}
        {success && (
          <div className={styles.success}>
            {success}
            {countdown > 0 && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                Redirecting in {countdown} second{countdown !== 1 ? "s" : ""}...
              </div>
            )}
            <div style={{ marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => router.push("/admin/login")}
                className={styles.loginButton}
                style={{ width: "100%" }}
              >
                Go to Login Now
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className={styles.forgotPassword}>
          <Link href="/admin/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
