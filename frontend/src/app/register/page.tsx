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
  const [passwordError, setPasswordError] = useState(""); // store password mismatch error

  const conditions = [
    { key: "length", text: "At least 8 characters", valid: form.password.length >= 8 },
    { key: "uppercase", text: "At least one uppercase letter", valid: /[A-Z]/.test(form.password) },
    { key: "number", text: "At least one number", valid: /\d/.test(form.password) },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    // Clear mismatch error while typing
    if (e.target.name === "confirmPassword") {
      setPasswordError("");
    }
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
    
    try {
      const result = await registerUser(form);
      if (result.success) {
        toast.success("Registration successful! Please log in.");
        setTimeout(() => {
          router.push("/login"); // <-- This redirects to login
        }, 1000); // Small delay to show the toast
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
};

  return (
    <>
      <header>
        <nav>
          <Image src="/images/Fix-it_logo_3.png" alt="Fixit Logo" className="logo" width={160} height={40} />
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
          <h1 id="form-title">Register</h1>
          <form onSubmit={handleSubmit} autoComplete="off">
            <input name="fName" type="text" placeholder="First Name" value={form.fName} onChange={handleChange} required />
            <input name="lName" type="text" placeholder="Last Name" value={form.lName} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />

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
                onBlur={handleConfirmBlur} // check mismatch when leaving field
                required
              />
              <span className="eye-icon" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? "👁️" : "🙈"}
              </span>
            </div>

            {/* Inline error under confirm password */}
            {passwordError && <p className="error-text">{passwordError}</p>}

            <input name="barangay" type="text" placeholder="Barangay" value={form.barangay} onChange={handleChange} required />
            <input name="municipality" type="text" placeholder="Municipality" value={form.municipality} onChange={handleChange} required />
            <input type="tel" id="contact" name="contact" placeholder="Enter contact number" pattern="[0-9]{10,15}" value={form.contact} onChange={handleChange} required />

            <button type="submit">Register</button>
          </form>
        </div>
      </div>
    </>
  );
}
