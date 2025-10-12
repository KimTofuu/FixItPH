"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./admin-profile.module.css";

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
    const confirmed = true; // called only after modal confirmation
    if (confirmed) {
      localStorage.clear();
      console.log("User logged out");
      window.location.href = "/login";
    }
  };

  return (
    <div className={styles.adminReportsRoot}>
      <header className={styles.header}>
        <nav className={styles.adminNav}>
          <div className={styles.navLeft}>
            <Image
              src="/images/Fix-it_logo_3.png"
              alt="Fixit Logo"
              className={styles.logo}
              width={160}
              height={40}
            />
          </div>

          <button
            className={`${styles.hamburger} ${menuOpen ? styles.open : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            type="button"
          >
            <span className={styles.bar} />
            <span className={styles.bar} />
            <span className={styles.bar} />
          </button>

          <ul className={`${styles.navListUserSide} ${menuOpen ? styles.open : ""}`}>
            <li>
              <a href="/admin-dashboard" className={styles.navLink}>Dashboard</a>
            </li>
            <li>
              <a href="/admin-reports" className={styles.navLink}>Reports</a>
            </li>
            <li>
              <a href="/admin-profile" className={styles.adminProfileLink} aria-label="Admin profile">
                <img
                  src={profilePic}
                  alt="Admin Profile"
                  className={styles.adminProfilePic}
                  width={36}
                  height={36}
                />
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <div className={styles.reportsPage}>
        <main id="profile-page" className={styles.mainContainer}>
          <div className={styles.contentCard}>

            <div className={styles.profileContainer}>
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatar}>
                  <img
                    src={profilePic}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className={styles.profileAvatarImg}
                    width={96}
                    height={96}
                  />
                </div>
                <div className={styles.profileName}>
                  <h2 className={styles.profileFullName}>{profile.firstName} {profile.lastName}</h2>
                  <p className={styles.profileEmail}>{profile.email}</p>
                </div>
              </div>

              {[
                { id: "firstName", type: "text", value: profile.firstName, label: "First name" },
                { id: "lastName", type: "text", value: profile.lastName, label: "Last name" },
                { id: "email", type: "email", value: profile.email, label: "Email" },
                { id: "password", type: "password", value: profile.password, label: "Password", placeholder: "••••••••" },
                { id: "barangay", type: "text", value: profile.barangay, label: "Barangay" },
                { id: "municipality", type: "text", value: profile.municipality, label: "Municipality" },
                { id: "contact", type: "tel", value: profile.contact, label: "Contact" },
              ].map(({ id, type, value, placeholder, label }) => (
                <div key={id} className={styles.profileField}>
                  <label htmlFor={id} className={styles.fieldLabel}>{label}</label>
                  <input
                    id={id}
                    name={id}
                    type={type}
                    value={value}
                    disabled={!isEditing}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={styles.inputField}
                  />
                </div>
              ))}

              <div className={styles.profileActions}>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={styles.editBtn}
                  aria-pressed={isEditing}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveBtn}
                  disabled={!isEditing}
                >
                  Save
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className={styles.logoutBtnProminent}
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showLogoutModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className={styles.modal}>
            <h3 id="logout-title" className={styles.modalTitle}>Confirm Log Out</h3>
            <p className={styles.modalBody}>Are you sure you want to log out? You will need to sign in again to access the admin dashboard.</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancel}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalConfirm}
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
