"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./ProfilePage.module.css";
import { toast } from "react-toastify";

interface ProfileData {
  _id: string;
  fName: string;
  lName: string;
  email: string;
  barangay?: string;
  municipality?: string;
  contact?: string;
  contactVerified?: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Change password modal state
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // SMS verification state
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsOtp, setSmsOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const profilePic = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;
        const res = await fetch(`${API}/users/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          console.warn("Failed to load profile:", res.status);
          return;
        }
        const data = await res.json();
        setProfile({
          _id: data._id || data.id,
          fName: data.fName || "",
          lName: data.lName || "",
          email: data.email || "",
          barangay: data.barangay || "",
          municipality: data.municipality || "",
          contact: data.contact || "",
          contactVerified: data.contactVerified || false,
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [API]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;
      const res = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Update failed");
        return;
      }
      const updated = await res.json();
      setProfile(updated);
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      console.error("Save profile error:", err);
      toast.error("Network error");
    }
  };

  const performLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleChangePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;
      const res = await fetch(`${API}/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Password change failed");
        setChangingPassword(false);
        return;
      }

      toast.success("Password changed");
      setShowChangePassModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Change password error:", err);
      toast.error("Network error");
    } finally {
      setChangingPassword(false);
    }
  };

  // Request SMS OTP
  const handleRequestSmsOtp = async () => {
    if (!profile?.contact) {
      toast.error("Please enter your contact number first");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch(`${API}/users/request-sms-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: profile.contact }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send OTP");
        return;
      }

      toast.success("OTP sent to your phone");
      setShowSmsModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify SMS OTP
  const handleVerifySmsOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!smsOtp || smsOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setVerifyingOtp(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/users/verify-sms-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          phone: profile?.contact,
          otp: smsOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Verification failed");
        return;
      }

      toast.success("Phone number verified!");
      setShowSmsModal(false);
      setSmsOtp("");

      // Refresh profile
      const profileRes = await fetch(`${API}/users/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (profileRes.ok) {
        const updatedProfile = await profileRes.json();
        setProfile(updatedProfile);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (!profile) return <div className={styles.loading}>Loading profile...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.headerWrap}>
        <nav className={styles.nav}>
          <div className={styles.brand}>
            <Image
              src="/images/Fix-it_logo_3.png"
              alt="Fixit Logo"
              className={styles.logo}
              width={160}
              height={40}
            />
          </div>

          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <ul className={`${styles.navList} ${menuOpen ? styles.open : ""}`}>
            <li>
              <a className={styles.navLink} href="/user-map">
                Map
              </a>
            </li>
            <li>
              <a className={styles.navLink} href="/user-feed">
                Feed
              </a>
            </li>
            <li>
              <a className={styles.navLink} href="/user-myreports">
                My Reports
              </a>
            </li>
            <li>
              <a className={styles.profileLink} href="/user-profile">
                <img
                  id="profilePic"
                  src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  alt="User Profile"
                  className={styles.profilePic}
                />
              </a>
            </li>
          </ul>
        </nav>

        {menuOpen && (
          <div className={styles.mobileMenu}>
            <Link href="/user-map" className={styles.mobileLink}>Map</Link>
            <Link href="/user-feed" className={styles.mobileLink}>Feed</Link>
            <Link href="/user-myreports" className={styles.mobileLink}>My Reports</Link>
          </div>
        )}
      </header>

      <main className={styles.container}>
        <section className={styles.card}>
          <div className={styles.headerRow}>
            <div className={styles.avatarWrap}>
              <Image
                src={profilePic}
                alt="avatar"
                width={88}
                height={88}
                className={styles.largeAvatar}
              />
            </div>

            <div className={styles.identity}>
              <h2 className={styles.name}>{profile.fName} {profile.lName}</h2>
              <p className={styles.email}>{profile.email}</p>
            </div>

            <div className={styles.headerActions}>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={styles.primary}
                >
                  Edit
                </button>
              )}
              {isEditing && (
                <button
                  onClick={handleSave}
                  className={styles.primaryDark}
                >
                  Save
                </button>
              )}
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>First name</label>
              <input
                name="fName"
                type="text"
                value={profile.fName}
                disabled={!isEditing}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Last name</label>
              <input
                name="lName"
                type="text"
                value={profile.lName}
                disabled={!isEditing}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                value={profile.email}
                disabled={!isEditing}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Barangay</label>
              <input
                name="barangay"
                type="text"
                value={profile.barangay || ""}
                disabled={!isEditing}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Municipality</label>
              <input
                name="municipality"
                type="text"
                value={profile.municipality || ""}
                disabled={!isEditing}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label}>Contact Number</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  name="contact"
                  type="tel"
                  value={profile.contact || ""}
                  disabled={!isEditing}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="+639XXXXXXXXX or 09XXXXXXXXX"
                  style={{ flex: 1 }}
                />
                {profile.contactVerified ? (
                  <span style={{ color: "#22c55e", fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" }}>
                    ✓ Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestSmsOtp}
                    disabled={sendingOtp || !profile.contact}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: profile.contact ? "#3b82f6" : "#d1d5db",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: profile.contact ? "pointer" : "not-allowed",
                      fontSize: "14px",
                      fontWeight: 500,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {sendingOtp ? "Sending..." : "Verify"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.actionsRow}>
            <button
              type="button"
              onClick={() => setShowChangePassModal(true)}
              className={styles.linkButton}
            >
              Change Password
            </button>

            <div className={styles.rightActions}>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className={styles.danger}
              >
                Log Out
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Confirm log out</h3>
            <p className={styles.modalText}>Are you sure you want to log out? You will be returned to the login screen.</p>

            <div className={styles.modalActions}>
              <button
                onClick={() => setShowLogoutModal(false)}
                className={styles.modalCancel}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  performLogout();
                }}
                className={styles.modalConfirm}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showChangePassModal && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Change password</h3>
            <p className={styles.modalText}>Enter your current password and a new password.</p>

            <form onSubmit={handleChangePassword} style={{ marginTop: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={styles.input}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.modalActions} style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className={styles.modalCancel}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className={styles.modalConfirm}
                >
                  {changingPassword ? "Changing..." : "Change password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS VERIFICATION MODAL */}
      {showSmsModal && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Verify Phone Number</h3>
            <p className={styles.modalText}>
              Enter the 6-digit code sent to {profile.contact}
            </p>

            <form onSubmit={handleVerifySmsOtp}>
              <input
                type="text"
                value={smsOtp}
                onChange={(e) =>
                  setSmsOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit code"
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "20px",
                  textAlign: "center",
                  letterSpacing: "0.5em",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  marginTop: "16px",
                  fontWeight: 500,
                }}
                autoFocus
              />

              <div className={styles.modalActions} style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSmsModal(false);
                    setSmsOtp("");
                  }}
                  className={styles.modalCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp || smsOtp.length !== 6}
                  className={styles.modalConfirm}
                  style={{
                    opacity: smsOtp.length === 6 ? 1 : 0.5,
                    cursor: smsOtp.length === 6 ? "pointer" : "not-allowed",
                  }}
                >
                  {verifyingOtp ? "Verifying..." : "Verify"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleRequestSmsOtp}
                disabled={sendingOtp}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  padding: "8px",
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  cursor: "pointer",
                  fontSize: "14px",
                  textDecoration: "underline",
                }}
              >
                {sendingOtp ? "Resending..." : "Resend Code"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
