"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./RegisterPage.module.css";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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

  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [registering, setRegistering] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password conditions
    const allConditionsMet = conditions.every((c) => c.valid);
    if (!allConditionsMet) {
      toast.error("Password does not meet all requirements");
      return;
    }

    try {
      setRegistering(true);

      // Step 1: Send OTP to user's email
      const otpRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        toast.error(otpData.message || "Failed to send OTP");
        return;
      }

      // Step 2: Show OTP modal for user to enter code
      toast.success("OTP sent to your email");
      setShowOtpModal(true);

    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    try {
      setVerifyingOtp(true);

      // Step 1: Verify OTP
      const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        toast.error(verifyData.message || "Invalid OTP");
        return;
      }

      // Step 2: If OTP is valid, proceed with registration
      const registerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const registerData = await registerRes.json();

      if (registerRes.ok && registerData.success) {
        toast.success("Registration successful!");
        setShowOtpModal(false);
        
        // Auto-login: Create token for the new user
        const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: form.email, 
            password: form.password 
          }),
        });

        const loginData = await loginRes.json();

        if (loginRes.ok && loginData.token) {
          // Save token
          localStorage.setItem("token", loginData.token);
          
          // Redirect to welcome page
          toast.success("Welcome to FixItPH!");
          setTimeout(() => router.push("/welcome"), 1000);
        } else {
          // If auto-login fails, redirect to login page
          toast.info("Please log in to continue");
          setTimeout(() => router.push("/login"), 1000);
        }
      } else {
        toast.error(registerData.message || "Registration failed");
      }

    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Network error verifying OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  useEffect(() => {
    document.body.classList.add("register-page-bg");
    return () => {
      document.body.classList.remove("register-page-bg");
    };
  }, []);

  const redirectToGoogle = () => {
    // This will redirect to your backend which handles Google OAuth
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

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

            <label className={styles.floatingLabel}>
              <input
                name="email"
                type="email"
                placeholder=" "
                value={form.email}
                onChange={handleChange}
                required
                className={styles.input}
              />
              <span className={styles.labelText}>Email</span>
            </label>

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

            <button className={styles.registerBtn} type="submit" disabled={registering}>
              {registering ? "Sending OTP..." : "Register"}
            </button>
          </form>

          <div className={styles.socialRow}>
            <button
              type="button"
              className={styles.googleBtn}
              onClick={redirectToGoogle}
              aria-label="Continue with Google"
            >
              <span className={styles.googleIcon} aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
                  <path d="M21.6 12.23c0-.68-.06-1.34-.18-1.97H12v3.73h5.48c-.24 1.33-.94 2.46-2 3.22v2.66h3.23c1.88-1.73 2.97-4.28 2.97-7.64z" fill="#4285F4"/>
                  <path d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.23-2.66c-.9.6-2.06.96-3.39.96-2.6 0-4.8-1.76-5.59-4.14H2.98v2.6C4.64 19.9 8.04 22 12 22z" fill="#34A853"/>
                  <path d="M6.41 13.74A6.972 6.972 0 0 1 6 12c0-.62.1-1.22.29-1.75V7.65H2.98A9.998 9.998 0 0 0 1 12c0 1.63.39 3.17 1.07 4.55l4.34-2.81z" fill="#FBBC05"/>
                  <path d="M12 6.5c1.47 0 2.8.5 3.85 1.49L19.06 5c-1.66-1.18-3.9-1.84-7.06-1.84-3.96 0-7.36 2.1-9.02 5.14l4.34 2.81C7.2 8.26 9.4 6.5 12 6.5z" fill="#EA4335"/>
                </svg>
              </span>
              <span className={styles.googleText}>Continue with Google</span>
            </button>
          </div>
        </div>
      </main>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className={styles.otpModalOverlay}>
          <div className={styles.otpModal} role="dialog" aria-modal="true">
            <h2>Verify Your Email</h2>
            <p>We've sent a 6-digit code to <b>{form.email}</b></p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              className={styles.input}
              autoFocus
            />
            <div className={styles.otpModalButtons}>
              <button onClick={verifyOtpAndRegister} disabled={verifyingOtp || otp.length !== 6} className={styles.primaryBtn}>
                {verifyingOtp ? "Verifying..." : "Verify & Register"}
              </button>
              <button onClick={() => setShowOtpModal(false)} className={styles.secondaryBtn} disabled={verifyingOtp}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
