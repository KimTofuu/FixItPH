// app/admin-users/page.tsx
"use client";
import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import "./admin-users.css";

type User = {
  _id: string;
  id?: string;
  name: string;
  address?: string;
  archived?: boolean;
};

type ReportRecord = {
  _id?: string;
  userId?: string;
  reporterId?: string;
};

export default function AdminUserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivingUserId, setArchivingUserId] = useState<string | null>(null);
  const [confirmOpenFor, setConfirmOpenFor] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const profilePicUrl = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersRes, reportsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`),
        ]);
        if (!usersRes.ok) throw new Error("Failed to fetch users");
        if (!reportsRes.ok) throw new Error("Failed to fetch reports");

        const usersData: any[] = await usersRes.json();
        const reportsData: any[] = await reportsRes.json();

        const normalizedUsers: User[] = (usersData || []).map((u: any) => ({
          _id: u._id || u.id,
          id: u._id || u.id,
          name: u.name || u.fullName || "No name",
          address: u.address || u.location || "No address provided",
          archived: !!u.archived,
        }));

        setUsers(normalizedUsers);
        setReports(reportsData || []);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const countReportsForUser = (userId?: string) =>
    reports.filter((r) => r.userId === userId || r.reporterId === userId).length;

  const handleOpenConfirm = (userId: string) => {
    setConfirmOpenFor(userId);
  };

  const closeConfirm = () => {
    setConfirmOpenFor(null);
  };

  const handleArchive = async (userId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });

      if (!res.ok) {
        const alt = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: true }),
        });
        if (!alt.ok) throw new Error("Failed to archive user");
      }

      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, archived: true } : u)));
      setArchivingUserId(userId);
      closeConfirm();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not archive user");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>FixIt PH - Admin Users</title>
        <link href="https://fonts.googleapis.com/css?family=Inter" rel="stylesheet" />
        <script src="https://kit.fontawesome.com/830b39c5c0.js" crossOrigin="anonymous" defer></script>
      </Head>

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
          <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <div className={`bar ${menuOpen ? "open" : ""}`}></div>
            <div className={`bar ${menuOpen ? "open" : ""}`}></div>
            <div className={`bar ${menuOpen ? "open" : ""}`}></div>
          </div>

          <ul className={`nav-list-user-side ${menuOpen ? "open" : ""}`}>
            <li>
              <a href="/admin-dashboard">Dashboard</a>
            </li>
            <li>
              <a href="/admin-reports">Reports</a>
            </li>

            {/* NEW Users link added for admin user list navigation (design only) */}
            <li
             style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "#f0f0f0",
              }}
            >
              <a href="/admin-users">Users</a>
            </li>

            <li>
              <a href="/admin-profile" className="admin-profile-link">
                <img
                  src={profilePicUrl}
                  alt="Admin Profile"
                  className="admin-profile-pic"
                />
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="admin-users-main">
        <div className="admin-users-header">
        </div>

        <section className="users-overview" aria-hidden={loading ? "true" : "false"}>
          <div className="overview-card">
            <div className="label">Total users</div>
            <div className="value">{loading ? "..." : users.length}</div>
          </div>
          <div className="overview-card">
            <div className="label">Total reports</div>
            <div className="value">{loading ? "..." : reports.length}</div>
          </div>
        </section>

        {error && (
          <div style={{ color: "crimson", marginBottom: 12 }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <section className="users-list" aria-live="polite">
          {loading ? (
            <div className="user-card">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="user-card">No users found.</div>
          ) : (
            users.map((user) => {
              const reportsCount = countReportsForUser(user._id);
              const isArchived = !!user.archived;
              const isConfirmOpen = confirmOpenFor === user._id;

              return (
                <div key={user._id} className={`user-card ${isArchived ? "archived" : ""}`}>
                  <div className="user-avatar">
                    <Image src="/images/user-avatar-placeholder.png" alt="user" width={56} height={56} />
                  </div>

                  <div className="user-content">
                    <div className="user-top">
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <div className="user-name">{user.name}</div>
                        <div className="user-status">{isArchived ? "Archived" : "Active"}</div>
                      </div>
                      <div style={{ fontSize: 13 }}>
                        <a href={`/admin-users/${user._id}`} style={{ color: "#0066cc", textDecoration: "none" }}>
                          View details
                        </a>
                      </div>
                    </div>

                    <div className="user-address">{user.address || "No address provided"}</div>

                    <div className="user-meta">
                      <div>
                        <strong style={{ marginRight: 6 }}>{reportsCount}</strong>reports
                      </div>
                    </div>
                  </div>

                  <div className="user-actions">
                    <button
                      onClick={() => handleOpenConfirm(user._id)}
                      disabled={isArchived || actionLoading}
                      className="btn"
                      aria-disabled={isArchived || actionLoading}
                    >
                      Archive
                    </button>
                  </div>

                  {isConfirmOpen && (
                    <div className="confirm-card" role="dialog" aria-modal="true">
                      <div className="title">Archive user?</div>
                      <div className="desc">
                        Archiving will mark this user as inactive and hide their profile from public listings.
                      </div>
                      <div className="actions">
                        <button onClick={() => closeConfirm()} className="btn">Cancel</button>
                        <button
                          onClick={() => handleArchive(user._id)}
                          disabled={actionLoading}
                          className="btn btn-danger"
                        >
                          {actionLoading ? "Archiving..." : "Confirm"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </main>
    </>
  );
}
