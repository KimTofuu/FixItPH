"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./LoginPage.module.css";
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
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

  
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        localStorage.setItem("token", data.token);
        router.push("/admin-reports");
      } else {
        toast.error(data.message || "Admin login failed");
      }
    } catch (error) {
      toast.error("An error occurred during admin login.");
      console.error("Admin login error:", error);
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

  const handleGoogleAuth = async () => {
    toast.info("Redirecting to Google...");
  };

  useEffect(() => {
    
    document.body.classList.add("login-page-bg");
    
    const el = document.querySelector(`.${styles.container}`);
    if (el) el.classList.add(styles.enter);
    return () => {
      document.body.classList.remove("login-page-bg");
      if (el) el.classList.remove(styles.enter);
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

      <div className={styles.login}>
        <div className={`${styles.loginContainer} ${styles.container}`}>
          <h1 id="form-title" className={styles.formTitle}>
            {isResident ? "Resident Login" : "Admin Login"}
          </h1>

          <div
            className={styles.toggle}
            onClick={toggleForm}
            role="button"
            tabIndex={0}
            aria-pressed={!isResident}
          >
            {isResident ? "Switch to Admin Login" : "Switch to Resident Login"}
          </div>

          <form
            autoComplete="off"
            id="resident-form"
            className={`${styles.form} ${isResident ? styles.active : ""}`}
            onSubmit={handleSubmit}
          >
            <label className={styles.floatingLabel}>
              <input
                type="email"
                name="email"
                placeholder=" "
                value={form.email}
                onChange={handleChange}
                required
                className={styles.input}
              />
              <span className={styles.labelText}>Resident Email</span>
            </label>

            <div className={styles.passwordWrapper}>
              <label className={styles.floatingLabel} style={{ flex: 1 }}>
                <input
                  type={showResidentPassword ? "text" : "password"}
                  name="password"
                  placeholder=" "
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
                <span className={styles.labelText}>Password</span>
              </label>

              <button
                type="button"
                className={styles.eyeIcon}
                onClick={() => setShowResidentPassword(!showResidentPassword)}
                aria-label="toggle resident password visibility"
              >
                {showResidentPassword ? "👁️" : "🙈"}
              </button>
            </div>

            <div className={styles.forgotRow}>
              <Link href="/user-forgotpassword" className={styles.forgotBtn} aria-label="Forgot resident password">
                Forgot password?
              </Link>
            </div>

            <button className={styles.loginBtn} type="submit">
              Log in
            </button>
          </form>

          <form
            autoComplete="off"
            id="admin-form"
            className={`${styles.form} ${!isResident ? styles.active : ""}`}
            onSubmit={handleAdminSubmit}
          >
            <label className={styles.floatingLabel}>
              <input
                type="email"
                name="email"
                placeholder=" "
                required
                className={styles.input}
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
              <span className={styles.labelText}>Admin Email</span>
            </label>

            <div className={styles.passwordWrapper}>
              <label className={styles.floatingLabel} style={{ flex: 1 }}>
                <input
                  type={showAdminPassword ? "text" : "password"}
                  name="password"
                  placeholder=" "
                  required
                  className={styles.input}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <span className={styles.labelText}>Password</span>
              </label>

              <button
                type="button"
                className={styles.eyeIcon}
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                aria-label="toggle admin password visibility"
              >
                {showAdminPassword ? "👁️" : "🙈"}
              </button>
            </div>

            <div className={styles.forgotRow}>
              <Link href="/admin-forgotpassword" className={styles.forgotBtn} aria-label="Forgot admin password">
                Forgot password?
              </Link>
            </div>

            <button className={styles.loginBtn} type="submit">
              Log in
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
