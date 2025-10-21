"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import styles from "./ForgotPassword.module.css";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Password reset link sent. Check your email.");
      } else {
        toast.error(data.message || "Unable to send reset link.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrap}>
      <div className={styles.container}>
        <h1 className={styles.title}>Reset your password</h1>

        <p className={styles.note}>
          Enter the email address associated with your account. We will send a link to reset your password.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
          <label className={styles.floatingLabel}>
            <input
              className={styles.input}
              name="email"
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <span className={styles.labelText}>Email</span>
          </label>

          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>

          <div className={styles.backRow}>
            <Link href="/login" className={styles.backLink}>Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
