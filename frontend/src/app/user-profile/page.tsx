"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import "./user-profile.css";
import { toast } from "react-toastify";

interface ProfileData {
  _id: string;
  fName: string;
  lName: string;
  email: string;
  barangay?: string;
  municipality?: string;
  contact?: string;
  // removed password from interface
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const profilePic = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;
        const res = await fetch(`${API}/users/profile`, {
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
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);

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
      const res = await fetch(`${API}/users/profile`, {
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

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div>
      {/* HEADER */}
      <header>
        <nav>
          <Image
            src="/images/Fix-it_logo_3.png"
            alt="Fixit Logo"
            className="logo"
            width={160}
            height={40}
          />

          {/* Hamburger Button */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>

          <ul className={`nav-list-user-side ${menuOpen ? "open" : ""}`}>
            <li><Link href="/user-map">Map</Link></li>
            <li><Link href="/user-feed">Feed</Link></li>
            <li><Link href="/user-myreports">My Reports</Link></li>
            <li>
              <Link style={{ color: "#aeaeaeff" }} href="/user-profile">
                <Image src={profilePic} alt="User Profile" width={40} height={40} />
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* PROFILE FORM */}
      <div id="profile-page">
        <div className="profile-container">
          <div className="profile-field">
            <input
              name="fName"
              type="text"
              value={profile.fName}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <input
              name="lName"
              type="text"
              value={profile.lName}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <input
              name="email"
              type="email"
              value={profile.email}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <input
              name="barangay"
              type="text"
              value={profile.barangay || ""}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <input
              name="municipality"
              type="text"
              value={profile.municipality || ""}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <input
              name="contact"
              type="tel"
              value={profile.contact || ""}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          {/* Buttons always visible */}
          <div
            className="profile-actions"
            style={{ marginTop: "15px", gap: "10px", display: "flex" }}
          >
            <button type="button" onClick={() => setIsEditing(true)} className="edit-btn">
              Edit
            </button>
            <button type="button" onClick={handleSave} className="save-btn">
              Save
            </button>

            <Link href="/change-password">
              <button
                type="button"
                className="change-password-btn"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Change Password
              </button>
            </Link>

            <button type="button" onClick={handleLogout} className="logout-btn">
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
