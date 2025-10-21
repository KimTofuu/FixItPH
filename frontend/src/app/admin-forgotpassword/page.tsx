"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import styles from "./AdminForgotPassword.module.css";
import Link from "next/link";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forgot-password`, {
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
        <h1 className={styles.title}>Admin password reset</h1>

        <p className={styles.note}>
          Enter the admin email address to receive a password reset link.
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
            <span className={styles.labelText}>Admin Email</span>
          </label>

          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>

          <div className={styles.backRow}>
            <Link href="/login" className={styles.backLink}>Back to admin login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
