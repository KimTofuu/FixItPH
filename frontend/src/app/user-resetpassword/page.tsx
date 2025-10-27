"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import styles from "./ResetPassword.module.css";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    const emailFromUrl = searchParams.get("email");
    
    if (tokenFromUrl) setToken(tokenFromUrl);
    if (emailFromUrl) setEmail(emailFromUrl);
    
    if (!tokenFromUrl || !emailFromUrl) {
      toast.error("Invalid reset link");
      setTimeout(() => router.push("/login"), 2000);
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Password reset successful!");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (err) {
      console.error("Reset error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrap}>
      <div className={styles.container}>
        <h1 className={styles.title}>Set New Password</h1>

        <p className={styles.note}>
          Please enter your new password below.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
          <div className={styles.passwordWrapper}>
            <label className={styles.floatingLabel}>
              <input
                className={styles.input}
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <span className={styles.labelText}>New Password</span>
            </label>
            <button
              type="button"
              className={styles.eyeIcon}
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? "👁️" : "🙈"}
            </button>
          </div>

          <div className={styles.passwordWrapper}>
            <label className={styles.floatingLabel}>
              <input
                className={styles.input}
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span className={styles.labelText}>Confirm Password</span>
            </label>
          </div>

          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <div className={styles.backRow}>
            <Link href="/login" className={styles.backLink}>Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}