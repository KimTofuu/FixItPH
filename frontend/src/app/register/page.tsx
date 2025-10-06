"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "./fixit-register.css";
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

  // 🔹 Google Authentication handler
  const handleGoogleAuth = async () => {
    toast.info("Redirecting to Google...");
    // Example placeholder — connect your real Google auth here
    // e.g. router.push("/api/auth/google") or Firebase logic
  };

  return (
    <>
      <header>
        <nav>
          <Image
            src="/images/Fix-it_logo_3.png"
            alt="Fixit Logo"
            className="logo"
            width={160}
            height={40}
          />
          <h1 id="form-title">Register</h1>
          <ul className="nav-list">
            <li>
              <Link href="/" style={{ marginRight: "2rem" }}>
                <button className="back-btn">Back</button>
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <div className="register">
        <div className="register-container">
          <form onSubmit={handleSubmit} autoComplete="off">
            <input name="fName" type="text" placeholder="First Name" value={form.fName} onChange={(e) => setForm({ ...form, fName: e.target.value })} required />
            <input name="lName" type="text" placeholder="Last Name" value={form.lName} onChange={(e) => setForm({ ...form, lName: e.target.value })} required />

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input name="email" type="email" placeholder="Email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailVerified(false); setOtpSent(false); }} required />
              <button type="button" onClick={sendOtp} disabled={sendingOtp || emailVerified}>
                {sendingOtp ? "Sending..." : emailVerified ? "Verified" : "Send OTP"}
              </button>
            </div>

            {otpSent && !emailVerified && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <button type="button" onClick={verifyOtp} disabled={verifyingOtp}>
                  {verifyingOtp ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            )}

            {/* Password input */}
            <div className="password-wrapper">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onFocus={() => setShowConditions(true)}
                onBlur={() => setTimeout(() => setShowConditions(false), 200)}
                onChange={handleChange}
                required
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "👁️" : "🙈"}
              </span>

              {showConditions && (
                <div className="password-conditions">
                  {conditions
                    .filter((c) => !c.valid)
                    .map((c) => (
                      <div key={c.key} className="condition-card">
                        {c.text}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="password-wrapper">
              <input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleConfirmBlur}
                required
              />
              <span className="eye-icon" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? "👁️" : "🙈"}
              </span>
            </div>

            {passwordError && <p className="error-text">{passwordError}</p>}

            <input name="barangay" type="text" placeholder="Barangay" value={form.barangay} onChange={handleChange} required />
            <input name="municipality" type="text" placeholder="Municipality" value={form.municipality} onChange={handleChange} required />
            <input type="tel" id="contact" name="contact" placeholder="Enter contact number" pattern="[0-9]{10,15}" value={form.contact} onChange={handleChange} required />

            {/* <button className="register-btn" type="submit">Register</button> */}

            {/* 🔹 Continue with Google button */}
            {/* 🔹 Continue with Google button */}
            <button
            type="button"
            className="google-signin-btn"
            onClick={handleGoogleAuth}
            >
            <Image
            src="/images/google-icon.png"
            alt="Google Icon"
            width={18}
            height={18}
            />
              <span>Continue with Google</span>
            </button>
            <button className="register-btn" type="submit" disabled={!emailVerified}>Register</button>
          </form>
        </div>
      </div>  
    </>
  );
}
