"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import "./fixit-login.css";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

async function loginUser(formData: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  return res.json();
}

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const router = useRouter();
  const [isResident, setIsResident] = useState(true);
  const [showResidentPassword, setShowResidentPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const adminData = {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminData),
      });
      
      const result = await res.json();
      
      if (result.token) {
        localStorage.setItem("adminToken", result.token);
        toast.success("Admin login successful! Redirecting...");
        setTimeout(() => router.push("/admin-dashboard"), 1000);
      } else {
        toast.error(result.message || "Admin login failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await loginUser(form);
      if (result.token) {
        localStorage.setItem("token", result.token);
        toast.success("Login successful! Redirecting...");
        setTimeout(() => router.push("/user-feed"), 1000);
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
  };

  const toggleForm = () => setIsResident(!isResident);

  // 🔹 Google Auth handler (placeholder)
  const handleGoogleAuth = async () => {
    toast.info("Redirecting to Google...");
    // e.g., router.push("/api/auth/google") or your Firebase sign-in logic
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
          <ul className="nav-list">
            <li>
              <Link href="/" style={{ marginRight: "2rem" }}>
                <button className="back-btn">Back</button>
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <div className="login">
        <div className="login-container">
          <h1 id="form-title">
            {isResident ? "Resident Login" : "Admin Login"}
          </h1>

          <div className="toggle" onClick={toggleForm}>
            {isResident ? "Switch to Admin Login" : "Switch to Resident Login"}
          </div>

          {/* Resident Login */}
          <form
            autoComplete="off"
            id="resident-form"
            className={isResident ? "active" : ""}
            onSubmit={handleSubmit}
          >
            <input
              type="email"
              name="email"
              placeholder="Resident Email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <div className="password-wrapper">
              <input
                type={showResidentPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <span
                className="eye-icon"
                onClick={() => setShowResidentPassword(!showResidentPassword)}
              >
                {showResidentPassword ? "👁️" : "🙈"}
              </span>
            </div>

            <button className="login-btn" type="submit">Log in</button>

            {/* 🔹 Google Auth Button */}
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
          </form>

          {/* Admin Login */}
          <form
            autoComplete="off"
            id="admin-form"
            className={!isResident ? "active" : ""}
            onSubmit={handleAdminSubmit}
          >
            <input 
              type="text" 
              name="username"
              placeholder="Admin Username" 
              required 
            />

            <div className="password-wrapper">
              <input
                type={showAdminPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                required
              />
              <span
                className="eye-icon"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
              >
                {showAdminPassword ? "👁️" : "🙈"}
              </span>
            </div>

            <button className="login-btn" type="submit">Log in</button>

            {/* 🔹 Google Auth Button */}
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
          </form>
        </div>
      </div>
    </>
  );
}
