"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./RegisterPage.module.css";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

async function registerUser(formData: {
  fName: string;
  lName: string;
  email: string;
  password: string;
  confirmPassword: string;
  barangay: string;
  municipality: string;
  contact: string;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  return res.json();
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fName: "",
    lName: "",
    email: "",
    password: "",
    confirmPassword: "",
    barangay: "",
    municipality: "",
    contact: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // modal control
  const [showOtpModal, setShowOtpModal] = useState(false);

  const conditions = [
    { key: "length", text: "At least 8 characters", valid: form.password.length >= 8 },
    { key: "uppercase", text: "At least one uppercase letter", valid: /[A-Z]/.test(form.password) },
    { key: "number", text: "At least one number", valid: /\d/.test(form.password) },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "confirmPassword") setPasswordError("");
  };

  const handleConfirmBlur = () => {
    if (form.confirmPassword && form.confirmPassword !== form.password) {
      setPasswordError("Password and Confirm Password do not match");
    } else {
      setPasswordError("");
    }
  };

  const sendOtp = async () => {
    if (!form.email) {
      toast.error("Enter your email first");
      return;
    }
    try {
      setSendingOtp(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setShowOtpModal(true);
        toast.success("OTP sent to your email");
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Network error sending OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setVerifyingOtp(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailVerified(true);
        setShowOtpModal(false);
        toast.success("Email verified");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch {
      toast.error("Network error verifying OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerified) {
      toast.error("Please verify your email first");
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Registration successful! Please log in.");
        setTimeout(() => router.push("/login"), 1000);
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  useEffect(() => {
    // add unique body class while this page is mounted
    document.body.classList.add("register-page-bg");
    return () => {
      document.body.classList.remove("register-page-bg");
    };
  }, []);

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Image
            src="/images/Fix-it_logo_3.png"
            alt="Fixit Logo"
            className={styles.logo}
            width={160}
            height={40}
          />
          <ul className={styles.navList}>
            <li>
              <Link href="/" aria-label="Back to home">
                <button className={styles.backBtn}>Back</button>
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main className={styles.register}>
        <div className={`${styles.registerContainer} ${styles.enter}`}>
          <form onSubmit={handleSubmit} autoComplete="off" className={styles.form} noValidate>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.floatingLabel}>
                  <input name="fName" type="text" placeholder=" " value={form.fName} onChange={handleChange} required className={styles.input} />
                  <span className={styles.labelText}>First Name</span>
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.floatingLabel}>
                  <input name="lName" type="text" placeholder=" " value={form.lName} onChange={handleChange} required className={styles.input} />
                  <span className={styles.labelText}>Last Name</span>
                </label>
              </div>
            </div>

            <div className={styles.rowInline}>
              <label className={styles.floatingLabel} style={{ flex: 1 }}>
                <input
                  name="email"
                  type="email"
                  placeholder=" "
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setEmailVerified(false);
                    setOtpSent(false);
                  }}
                  required
                  className={styles.input}
                />
                <span className={styles.labelText}>Email</span>
              </label>

              <button className={styles.otpBtn} type="button" onClick={sendOtp} disabled={sendingOtp || emailVerified}>
                {sendingOtp ? "Sending..." : emailVerified ? "Verified" : "Send OTP"}
              </button>
            </div>

            <div className={styles.passwordWrapper}>
              <label className={styles.floatingLabel} style={{ flex: 1 }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={form.password}
                  onFocus={() => setShowConditions(true)}
                  onBlur={() => setTimeout(() => setShowConditions(false), 200)}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
                <span className={styles.labelText}>Password</span>
              </label>

              <button type="button" className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)} aria-label="toggle password visibility">
                {showPassword ? "👁️" : "🙈"}
              </button>

              {showConditions && (
                <div className={styles.passwordConditions}>
                  {conditions.map((c) => (
                    <div key={c.key} className={styles.conditionCard}>
                      <span className={c.valid ? styles.okDot : styles.badDot} />
                      {c.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.passwordWrapper}>
              <label className={styles.floatingLabel} style={{ flex: 1 }}>
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder=" "
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleConfirmBlur}
                  required
                  className={styles.input}
                />
                <span className={styles.labelText}>Confirm Password</span>
              </label>
              <button type="button" className={styles.eyeIcon} onClick={() => setShowConfirm(!showConfirm)} aria-label="toggle confirm visibility">
                {showConfirm ? "👁️" : "🙈"}
              </button>
            </div>

            {passwordError && <p className={styles.errorText}>{passwordError}</p>}

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.floatingLabel}>
                  <input name="barangay" type="text" placeholder=" " value={form.barangay} onChange={handleChange} required className={styles.input} />
                  <span className={styles.labelText}>Barangay</span>
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.floatingLabel}>
                  <input name="municipality" type="text" placeholder=" " value={form.municipality} onChange={handleChange} required className={styles.input} />
                  <span className={styles.labelText}>Municipality</span>
                </label>
              </div>
            </div>

            <label className={styles.floatingLabel}>
              <input type="tel" id="contact" name="contact" placeholder=" " pattern="[0-9]{10,15}" value={form.contact} onChange={handleChange} required className={styles.input} />
              <span className={styles.labelText}>Contact number</span>
            </label>

            <button className={styles.registerBtn} type="submit" disabled={!emailVerified}>
              Register
            </button>
          </form>
        </div>
      </main>

      {showOtpModal && (
        <div className={styles.otpModalOverlay}>
          <div className={styles.otpModal} role="dialog" aria-modal="true">
            <h2>Verify OTP</h2>
            <p>Enter the 6-digit code sent to <b>{form.email}</b></p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className={styles.input}
            />
            <div className={styles.otpModalButtons}>
              <button onClick={verifyOtp} disabled={verifyingOtp} className={styles.primaryBtn}>
                {verifyingOtp ? "Verifying..." : "Verify"}
              </button>
              <button onClick={() => setShowOtpModal(false)} className={styles.secondaryBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
