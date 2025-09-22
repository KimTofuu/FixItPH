"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "../fixit-css.css";

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

  const profilePic =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    alert("Profile updated successfully!\n\n" + JSON.stringify(profile, null, 2));
    console.log("Saved profile:", profile);
  };

  return (
    <div>
      {/* HEADER */}
      <header>
        <nav>
          <Image src="/images/Fix-it_logo_2.png" alt="Fixit Logo" className="logo" width={160} height={40} />
          <ul className="nav-list-user-side">
            <li><Link href="/user-map">Map</Link></li>
            <li><Link href="/user-feed">Feed</Link></li>
            <li><Link href="/user-myreports">My Reports</Link></li>
            <li>
              <Link href="/user-profile">
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
            <label>First Name</label>
            <input
              name="firstName"
              type="text"
              value={profile.firstName}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label>Last Name</label>
            <input
              name="lastName"
              type="text"
              value={profile.lastName}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={profile.email}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label>Password</label>
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
            <label>Barangay</label>
            <input
              name="barangay"
              type="text"
              value={profile.barangay}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label>Municipality</label>
            <input
              name="municipality"
              type="text"
              value={profile.municipality}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label>Contact</label>
            <input
              name="contact"
              type="tel"
              value={profile.contact}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </div>

          {/* Buttons always visible */}
          <div className="profile-actions" style={{ marginTop: "15px", gap: "10px", display: "flex" }}>
            <button type="button" onClick={() => setIsEditing(true)} className="edit-btn">
              Edit
            </button>
            <button type="button" onClick={handleSave} className="save-btn">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
