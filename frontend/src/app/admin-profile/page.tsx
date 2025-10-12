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
  const [menuOpen, setMenuOpen] = useState(false);

  const profilePic = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    alert("Profile updated successfully!\n\n" + JSON.stringify(profile, null, 2));
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
          }}
        >
          <div className="nav-left">
            <Image
              src="/images/Fix-it_logo_3.png"
              alt="Fixit Logo"
              className="logo"
              width={160}
              height={40}
            />
          </div>

          {/* Hamburger icon */}
          <button
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            type="button"
          >
            <span className={`bar ${menuOpen ? "open" : ""}`} />
            <span className={`bar ${menuOpen ? "open" : ""}`} />
            <span className={`bar ${menuOpen ? "open" : ""}`} />
          </button>

          <ul className={`nav-list-user-side ${menuOpen ? "open" : ""}`}>
            <li>
              <a href="/admin-dashboard">Dashboard</a>
            </li>
            <li>
              <a href="/admin-reports">Reports</a>
            </li>
            <li>
              <a href="/admin-users">Users</a>
            </li>
            <li>
              <a href="/admin-profile" className="admin-profile-link" aria-label="Admin profile">
                <img
                  src={profilePic}
                  alt="Admin Profile"
                  className="admin-profile-pic"
                  width={36}
                  height={36}
                />
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* PROFILE FORM */}
      <main id="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <img
                src={profilePic}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="profile-avatar-img"
                width={96}
                height={96}
              />
            </div>
            <div className="profile-name">
              <h2>{profile.firstName} {profile.lastName}</h2>
              <p className="profile-email">{profile.email}</p>
            </div>
          </div>

          <div className="profile-field">
            <label htmlFor="firstName" className="visually-hidden">First name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={profile.firstName}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="lastName" className="visually-hidden">Last name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={profile.lastName}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="email" className="visually-hidden">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={profile.email}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="password" className="visually-hidden">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={profile.password}
              disabled={!isEditing}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          <div className="profile-field">
            <label htmlFor="barangay" className="visually-hidden">Barangay</label>
            <input
              id="barangay"
              name="barangay"
              type="text"
              value={profile.barangay}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="municipality" className="visually-hidden">Municipality</label>
            <input
              id="municipality"
              name="municipality"
              type="text"
              value={profile.municipality}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="contact" className="visually-hidden">Contact</label>
            <input
              id="contact"
              name="contact"
              type="tel"
              value={profile.contact}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div
            className="profile-actions"
            style={{ marginTop: "15px", gap: "10px", display: "flex" }}
          >
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="edit-btn"
              aria-pressed={isEditing}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="save-btn"
              disabled={!isEditing}
            >
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
      </main>
    </div>
  );
}
