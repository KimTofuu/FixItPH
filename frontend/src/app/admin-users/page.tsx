"use client";
import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "./admin-users.module.css";

type User = {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  address?: string;
  archived?: boolean;
  lastLogin?: string;
};

type ReportRecord = {
  _id?: string;
  userId?: string;
  reporterId?: string;
};

const HARDCODED_USERS: User[] = [
  { _id: "20230330", id: "20230330", name: "Francescha Lei Arcega", email: "20230330@gordoncollege.edu.ph", address: "Gordon College", archived: false, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString() },
  { _id: "20230331", id: "20230331", name: "Vincent David Ong", email: "20230331@gordoncollege.edu.ph", address: "Gordon College", archived: false, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { _id: "20230332", id: "20230332", name: "Paulo Cordova", email: "20230332@gordoncollege.edu.ph", address: "Gordon College", archived: false, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString() },
  { _id: "20230333", id: "20230333", name: "Catherine Mon", email: "20230333@gordoncollege.edu.ph", address: "Gordon College", archived: false, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { _id: "20230334", id: "20230334", name: "Paul Jan Dilag", email: "20230334@gordoncollege.edu.ph", address: "Gordon College", archived: false, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString() },
  { _id: "202312263", id: "202312263", name: "Francis Rosete", email: "202312263@gordoncollege.edu.ph", address: "East Tapinac, Olongapo", archived: false, lastLogin: new Date().toISOString() },
  { _id: "202312264", id: "202312264", name: "Galo Matheny", email: "archived_user@example.com", address: "Archived Location", archived: true, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString() },
];

export default function AdminUserListPage() {
  const [users, setUsers] = useState<User[]>(HARDCODED_USERS);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpenFor, setConfirmOpenFor] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "archived">("all");
  const [viewingUser, setViewingUser] = useState<User | null>(null);

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
          email: u.email || u.emailAddress || `${u._id || u.id}@example.com`,
          address: u.address || u.location || "No address provided",
          archived: !!u.archived,
          lastLogin: u.lastLogin || undefined,
        }));
        const fetchedMap = new Map(normalizedUsers.map((u) => [u._id, u]));
        const merged = HARDCODED_USERS.map((hc) => fetchedMap.get(hc._id) || hc);
        normalizedUsers.forEach((u) => {
          if (!merged.find((m) => m._id === u._id)) merged.push(u);
        });
        setUsers(merged);
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

  const computeCredibilityLabel = (reportsCount: number) => {
    if (reportsCount === 0) return "Trusted";
    if (reportsCount <= 2) return "Trusted";
    return "Newcomer";
  };

  const isActiveFromLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return false;
    const then = new Date(lastLogin).getTime();
    const diffDays = (Date.now() - then) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  };

  const deriveStatusForUser = (u: User) => {
    const reportsCount = countReportsForUser(u._id);
    if (reportsCount >= 3) return "newcomer";
    return "trusted";
  };

  const filteredAndSearchedUsers = users
    .filter((u) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "archived") return !!u.archived;
      const active = isActiveFromLastLogin(u.lastLogin);
      return statusFilter === "active" ? active && !u.archived : !active && !u.archived;
    })
    .filter((u) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.address || "").toLowerCase().includes(q) ||
        (u.id || "").toLowerCase().includes(q)
      );
    });

  const handleOpenConfirm = (userId: string) => {
    setConfirmOpenFor(userId);
  };

  const closeConfirm = () => {
    setConfirmOpenFor(null);
  };

  // Archive: allowed for active or inactive users (not allowed when archived)
  const handleArchive = async (userId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const user = users.find((u) => u._id === userId);
      if (!user) throw new Error("User not found");
      if (user.archived) {
        throw new Error("User is already archived");
      }

      const apiBody = { archived: true };

      // Try preferred API endpoint first
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });

      if (!res.ok) {
        // fallback to generic users patch endpoint
        const alt = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        if (!alt.ok) throw new Error("Failed to archive user");
      }

      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, archived: true } : u)));
      closeConfirm();
      setViewingUser(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not archive user");
    } finally {
      setActionLoading(false);
    }
  };

  // Modal text helpers
  const getConfirmMeta = (u: User | null) => {
    if (!u) return { title: "Confirm", description: "Are you sure?", confirmLabel: "Confirm" };
    if (u.archived) {
      return {
        title: "No action available",
        description: `User "${u.name}" is archived and cannot be modified.`,
        confirmLabel: "Close",
      };
    }
    const active = isActiveFromLastLogin(u.lastLogin);
    return {
      title: "Archive user?",
      description: active
        ? `User "${u.name}" is currently active. Archiving will mark them as archived and hide their profile from public listings.`
        : `User "${u.name}" is currently inactive. Archiving will mark them as archived and hide their profile from public listings.`,
      confirmLabel: "Archive",
    };
  };

  return (
    <>
      <Head>
        <title>FixIt PH - Admin Users</title>
        <link href="https://fonts.googleapis.com/css?family=Inter" rel="stylesheet" />
        <script src="https://kit.fontawesome.com/830b39c5c0.js" crossOrigin="anonymous" defer></script>
      </Head>

      <div className={styles.adminUsersRoot}>
        <header className={styles.header}>
          <nav className={styles.adminNav}>
            <div className={styles.navLeft}>
              <Image src="/images/Fix-it_logo_3.png" alt="Fixit Logo" className={styles.logo} width={160} height={40} />
            </div>

            <ul className={`${styles.navListUserSide} ${menuOpen ? styles.open : ""}`}>
              <li>
                <a href="/admin-dashboard" className={styles.navLink}>Dashboard</a>
              </li>
              <li>
                <a href="/admin-map" className={styles.navLink}>Map</a>
              </li>
              <li>
                <a href="/admin-reports" className={styles.navLink}>Reports</a>
              </li>
              <li className={styles.activeNavItem}>
                <a href="/admin-users" className={styles.navLink}>Users</a>
              </li>
              <li>
                <a href="/admin-flag" className={styles.navLink}>Flagged</a>
              </li>
              <li>
                <a href="/admin-profile" className={styles.adminProfileLink}>
                  <img
                    src={profilePicUrl}
                    alt="Admin Profile"
                    className={styles.adminProfilePic}
                  />
                </a>
              </li>
            </ul>
          </nav>
        </header>

        <main className={styles.adminUsersMain}>
          <div className={styles.headerRow}>
            <div className={styles.controls}>
              <section className={styles.overview} aria-hidden={loading ? "true" : "false"}>
                <div className={styles.overviewCard}>
                  <div className={styles.label}>Total users</div>
                  <div className={styles.value}>{loading ? "..." : users.length}</div>
                </div>
                <div className={styles.overviewCard}>
                  <div className={styles.label}>Total reports</div>
                  <div className={styles.value}>{loading ? "..." : reports.length}</div>
                </div>
              </section>
              <div className={styles.searchWrap}>
                <input
                  aria-label="Search users"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <i className="fa fa-search" aria-hidden />
              </div>

              <button className={styles.btn}>Export</button>
           



           </div>
          </div>

          {error && <div className={styles.error}><strong>Error:</strong> {error}</div>}

          <section className={styles.tableSection}>
            <div className={styles.filterRow}>
              <button className={`${styles.filterBtn} ${statusFilter === "all" ? styles.active : ""}`} onClick={() => setStatusFilter("all")}>All</button>
              <button className={`${styles.filterBtn} ${statusFilter === "active" ? styles.active : ""}`} onClick={() => setStatusFilter("active")}>Active</button>
              <button className={`${styles.filterBtn} ${statusFilter === "inactive" ? styles.active : ""}`} onClick={() => setStatusFilter("inactive")}>Inactive</button>
              <button className={`${styles.filterBtn} ${statusFilter === "archived" ? styles.active : ""}`} onClick={() => setStatusFilter("archived")}>Archived</button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.usersTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Reports</th>
                    <th>Credibility</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody className={styles.tbodyScrollable}>
                  {loading ? (
                    <tr><td colSpan={8} className={styles.emptyCell}>Loading users...</td></tr>
                  ) : filteredAndSearchedUsers.length === 0 ? (
                    <tr><td colSpan={8} className={styles.emptyCell}>No users found.</td></tr>
                  ) : (
                    filteredAndSearchedUsers.map((user) => {
                      const reportsCount = countReportsForUser(user._id);
                      const credibility = computeCredibilityLabel(reportsCount);
                      const isArchived = !!user.archived;
                      const active = isActiveFromLastLogin(user.lastLogin);

                      return (
                        <tr key={user._id} className={isArchived ? styles.archivedRow : ""}>
                          <td className={styles.cellId}>{user.id || user._id}</td>
                          <td>
                            <div className={styles.nameCell}>
                              <div className={styles.nameText}>{user.name}</div>
                              <div className={styles.subText}>{isArchived ? "Archived" : active ? "Active" : "Inactive"}</div>
                            </div>
                          </td>
                          <td>{user.email || `${user.id || user._id}@example.com`}</td>
                          <td>{user.address || "No address provided"}</td>
                          <td><strong>{reportsCount}</strong></td>
                          <td><span className={`${styles.credBadge} ${styles[`cred_${credibility.toLowerCase()}`]}`}>{credibility}</span></td>
                          <td><div className={active ? styles.activeStatus : styles.inactiveStatus}>{active ? "Active" : "Inactive"}</div></td>
                          <td>
                            <div className={styles.detailsCell}>
                              <button onClick={() => setViewingUser(user)} className={styles.linkBtn}>View</button>
                              {/* Show Archive action only when user is NOT archived */}
                              {!isArchived && (
                                <button
                                  onClick={() => handleOpenConfirm(user._id)}
                                  className={`${styles.btn} ${styles.btnDanger}`}
                                >
                                  Archive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Confirmation modal */}
          {confirmOpenFor && (() => {
            const u = users.find((x) => x._id === confirmOpenFor) || null;
            const meta = getConfirmMeta(u);
            // If user is archived, modal is informational only (no destructive action)
            const isInformational = !!u && !!u.archived;
            return (
              <div className={styles.confirmCard} role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc">
                <div id="confirm-title" className={styles.title}>{meta.title}</div>
                <div id="confirm-desc" className={styles.desc}>{meta.description}</div>
                <div className={styles.actions}>
                  <button onClick={() => closeConfirm()} className={styles.btn}>{isInformational ? "Close" : "Cancel"}</button>
                  {!isInformational && (
                    <button
                      onClick={() => confirmOpenFor && handleArchive(confirmOpenFor)}
                      disabled={actionLoading}
                      className={`${styles.btn} ${styles.btnDanger}`}
                    >
                      {actionLoading ? "Archiving..." : meta.confirmLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Viewing user modal */}
          {viewingUser && (
            <div className={styles.modalBackdrop} role="dialog" aria-modal="true" onClick={() => setViewingUser(null)}>
              <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h3>User details</h3>
                  <button onClick={() => setViewingUser(null)} className={styles.linkBtn}>Close</button>
                </div>

                <div className={styles.modalGrid}>
                  <div className={styles.labelCol}>ID</div>
                  <div>{viewingUser.id || viewingUser._id}</div>

                  <div className={styles.labelCol}>Name</div>
                  <div>{viewingUser.name}</div>

                  <div className={styles.labelCol}>Email</div>
                  <div>{viewingUser.email || `${viewingUser.id || viewingUser._id}@example.com`}</div>

                  <div className={styles.labelCol}>Location</div>
                  <div>{viewingUser.address || "No address provided"}</div>

                  <div className={styles.labelCol}>Reports</div>
                  <div>{countReportsForUser(viewingUser._id)}</div>

                  <div className={styles.labelCol}>Credibility</div>
                  <div>{computeCredibilityLabel(countReportsForUser(viewingUser._id))}</div>

                  <div className={styles.labelCol}>Status</div>
                  <div>{viewingUser.archived ? "Archived" : isActiveFromLastLogin(viewingUser.lastLogin) ? "Active" : "Inactive"}</div>

                  <div className={styles.labelCol}>Last Login</div>
                  <div>{viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleString() : "Never"}</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
