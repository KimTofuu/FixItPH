"use client";

import { useState } from "react";
import styles from "./ForgotPassword.module.css";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // keep response handling generic to avoid user enumeration
      if (res.ok) {
        setStatus("success");
        setMessage("If an account exists for this email, a reset link has been sent.");
      } else {
        setStatus("success");
        setMessage("If an account exists for this email, a reset link has been sent.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.lead}>
          Enter the email associated with your account and we'll send a password reset link.
        </p>

        <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
          <label className={styles.label}>
            <span className={styles.labelText}>Email</span>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              aria-describedby="helper-text"
            />
          </label>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Send reset link"}
            </button>

            <Link href="/login" className={styles.secondaryLink}>
              Back to login
            </Link>
          </div>
        </form>

        <div
          role="status"
          aria-live="polite"
          className={styles.message}
        >
          {message}
        </div>

        <p id="helper-text" className={styles.helper}>
          We'll send a password reset link to this email if it exists in our system.
        </p>
      </div>
    </div>
  );
}
