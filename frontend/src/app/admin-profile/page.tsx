"use client";

import { useState } from "react";
import Image from "next/image";
import "./admin-profile.css";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  barangay: string;
  municipality: string;
  contact: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan.delacruz@email.com",
    password: "",
    barangay: "San Isidro",
    municipality: "Quezon City",
    contact: "09123456789",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // 👈 hamburger toggle state

  const profilePic = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    alert(
      "Profile updated successfully!\n\n" + JSON.stringify(profile, null, 2)
    );
    console.log("Saved profile:", profile);
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.clear();
      console.log("User logged out");
      window.location.href = "/login";
    }
  };

  return (
    <div>
      {/* HEADER */}
      <header>
        <nav
          className="admin-nav"
          style={{
            width: "100%",
            background: "white",
            color: "black",
            position: "relative",
          }}
        >
          <Image
            src="/images/Fix-it_logo_3.png"
            alt="Fixit Logo"
            className="logo"
            width={160}
            height={40}
          />

          {/* HAMBURGER BUTTON */}
          <button
            className="hamburger"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            ☰
          </button>

          {/* NAVIGATION LINKS */}
          <ul className={`nav-list-user-side ${menuOpen ? "open" : ""}`}>
            <li>
              <a href="/admin-dashboard">Dashboard</a>
            </li>
            <li>
              <a href="/admin-reports">Reports</a>
            </li>
            <li>
              <a href="/admin-profile" className="admin-profile-link">
                <img
                  src={profilePic}
                  alt="Admin Profile"
                  className="admin-profile-pic"
                />
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* PROFILE FORM */}
      <div id="profile-page">
        <div className="profile-container">
          <div className="profile-field">
            <input
              name="firstName"
              type="text"
              value={profile.firstName}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <input
              name="lastName"
              type="text"
              value={profile.lastName}
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
              name="password"
              type="password"
              value={profile.password}
              disabled={!isEditing}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          <div className="profile-field">
            <input
              name="barangay"
              type="text"
              value={profile.barangay}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <input
              name="municipality"
              type="text"
              value={profile.municipality}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <input
              name="contact"
              type="tel"
              value={profile.contact}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          {/* Buttons always visible */}
          <div
            className="profile-actions"
            style={{ marginTop: "15px", gap: "10px", display: "flex" }}
          >
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="edit-btn"
            >
              Edit
            </button>
            <button type="button" onClick={handleSave} className="save-btn">
              Save
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="logout-btn"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
