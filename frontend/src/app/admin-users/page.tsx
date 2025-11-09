"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
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
  reputation?: {
    points: number;
    level: string;
    totalReports: number;
  };
};

type UserStats = {
  totalUsers: number;
  activeUsers: number;
  archivedUsers: number;
  totalReports: number;
};

export default function AdminUserListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpenFor, setConfirmOpenFor] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "archived">("all");
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const profilePicUrl = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Please login first");
        router.push("/login");
        return;
      }

      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API}/admin/users/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!usersRes.ok) {
        if (usersRes.status === 401 || usersRes.status === 403) {
          toast.error("Session expired. Please login again.");
          localStorage.clear();
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch users");
      }

      if (!statsRes.ok) throw new Error("Failed to fetch stats");

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      console.log("✅ Fetched users:", usersData.length);
      console.log("✅ Stats:", statsData);

      setUsers(usersData);
      setStats(statsData);
    } catch (err: any) {
      console.error("❌ Fetch error:", err);
      setError(err?.message || "Failed to load data");
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const computeCredibilityLabel = (user: User) => {
    const reportsCount = user.reputation?.totalReports || 0;
    if (reportsCount === 0) return "Newcomer";
    if (reportsCount <= 2) return "Trusted";
    if (reportsCount <= 5) return "Active";
    return "Veteran";
  };

  const isActiveFromLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return false;
    const then = new Date(lastLogin).getTime();
    const diffDays = (Date.now() - then) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
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

  const handleArchive = async (userId: string) => {
    setActionLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      const user = users.find((u) => u._id === userId);
      
      if (!user) throw new Error("User not found");
      if (user.archived) throw new Error("User is already archived");

      const res = await fetch(`${API}/admin/users/${userId}/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to archive user");
      }

      toast.success("User archived successfully");
      
      // Update local state
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, archived: true } : u)));
      closeConfirm();
      setViewingUser(null);
      
      // Refresh stats
      fetchData();
    } catch (err: any) {
      console.error("❌ Archive error:", err);
      setError(err?.message || "Could not archive user");
      toast.error(err?.message || "Failed to archive user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnarchive = async (userId: string) => {
    setActionLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/admin/users/${userId}/unarchive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to unarchive user");
      }

      toast.success("User unarchived successfully");
      
      // Update local state
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, archived: false } : u)));
      setViewingUser(null);
      
      // Refresh stats
      fetchData();
    } catch (err: any) {
      console.error("❌ Unarchive error:", err);
      toast.error(err?.message || "Failed to unarchive user");
    } finally {
      setActionLoading(false);
    }
  };

  const getConfirmMeta = (u: User | null) => {
    if (!u) return { title: "Confirm", description: "Are you sure?", confirmLabel: "Confirm" };
    if (u.archived) {
      return {
        title: "Unarchive user?",
        description: `User "${u.name}" is currently archived. Unarchiving will restore their account.`,
        confirmLabel: "Unarchive",
      };
    }
    const active = isActiveFromLastLogin(u.lastLogin);
    return {
      title: "Archive user?",
      description: active
        ? `User "${u.name}" is currently active. Archiving will hide their profile from public listings.`
        : `User "${u.name}" is currently inactive. Archiving will hide their profile from public listings.`,
      confirmLabel: "Archive",
    };
  };

  const handleExport = () => {
    // Convert users to CSV
    const headers = ["ID", "Name", "Email", "Location", "Reports", "Credibility", "Status", "Last Login"];
    const rows = filteredAndSearchedUsers.map(u => [
      u.id || u._id,
      u.name,
      u.email || "",
      u.address || "",
      u.reputation?.totalReports || 0,
      computeCredibilityLabel(u),
      u.archived ? "Archived" : isActiveFromLastLogin(u.lastLogin) ? "Active" : "Inactive",
      u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Users exported successfully");
  };

  const truncateId = (id: string) => {
    if (!id || id.length <= 12) return id;
    return `${id.substring(0, 4)}...${id.substring(id.length - 4)}`;
  };

  // ✅ Add copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("ID copied to clipboard!");
    }).catch((err) => {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy ID");
    });
  };

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "48px", marginBottom: "16px" }}></i>
          <p style={{ fontSize: "18px" }}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>FixIt PH - Admin Users</title>
        <link href="https://fonts.googleapis.com/css?family=Inter" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <div className={styles.adminUsersRoot}>
        <header className={styles.header}>
          <nav className={styles.adminNav}>
            <div className={styles.navLeft}>
              <Image src="/images/Fix-it_logo_3.png" alt="Fixit Logo" className={styles.logo} width={160} height={40} />
            </div>

            <button
              className={`${styles.hamburger} ${menuOpen ? styles.open : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
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

              <button className={styles.btn} onClick={handleExport}>
                <i className="fa fa-download" style={{ marginRight: "8px" }}></i>
                Export
              </button>
            </div>
          </div>

          {error && <div className={styles.error}><strong>Error:</strong> {error}</div>}

          <section className={styles.tableSection}>
            <div className={styles.filterRow}>
              <button className={`${styles.filterBtn} ${statusFilter === "all" ? styles.active : ""}`} onClick={() => setStatusFilter("all")}>
                All ({users.length})
              </button>
              <button className={`${styles.filterBtn} ${statusFilter === "active" ? styles.active : ""}`} onClick={() => setStatusFilter("active")}>
                Active ({users.filter(u => isActiveFromLastLogin(u.lastLogin) && !u.archived).length})
              </button>
              <button className={`${styles.filterBtn} ${statusFilter === "inactive" ? styles.active : ""}`} onClick={() => setStatusFilter("inactive")}>
                Inactive ({users.filter(u => !isActiveFromLastLogin(u.lastLogin) && !u.archived).length})
              </button>
              <button className={`${styles.filterBtn} ${statusFilter === "archived" ? styles.active : ""}`} onClick={() => setStatusFilter("archived")}>
                Archived ({users.filter(u => u.archived).length})
              </button>
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
                    <tr><td colSpan={8} className={styles.emptyCell}>
                      <i className="fa-solid fa-spinner fa-spin"></i> Loading users...
                    </td></tr>
                  ) : filteredAndSearchedUsers.length === 0 ? (
                    <tr><td colSpan={8} className={styles.emptyCell}>No users found.</td></tr>
                  ) : (
                    filteredAndSearchedUsers.map((user) => {
                      const reportsCount = user.reputation?.totalReports || 0;
                      const credibility = computeCredibilityLabel(user);
                      const isArchived = !!user.archived;
                      const active = isActiveFromLastLogin(user.lastLogin);
                      const fullId = user.id || user._id;

                      return (
                        <tr key={user._id} className={isArchived ? styles.archivedRow : ""}>
                          <td className={styles.cellId}>
                            <div className={styles.idWrapper} title={fullId}>
                              <span className={styles.idText}>{truncateId(fullId)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(fullId);
                                }}
                                className={styles.copyBtn}
                                aria-label="Copy ID"
                                title="Copy full ID"
                              >
                                <i className="fa-regular fa-copy">Copy</i> {/* ✅ Changed to fa-regular */}
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className={styles.nameCell}>
                              <div className={styles.nameText}>{user.name}</div>
                              <div className={styles.subText}>
                                {user.reputation?.level || 'Newcomer'}
                              </div>
                            </div>
                          </td>
                          <td>{user.email || "N/A"}</td>
                          <td>{user.address || "No address provided"}</td>
                          <td><strong>{reportsCount}</strong></td>
                          <td><span className={`${styles.credBadge} ${styles[`cred_${credibility.toLowerCase()}`]}`}>{credibility}</span></td>
                          <td>
                            <div className={active && !isArchived ? styles.activeStatus : styles.inactiveStatus}>
                              {isArchived ? "Archived" : active ? "Active" : "Inactive"}
                            </div>
                          </td>
                          <td>
                            <div className={styles.detailsCell}>
                              <button onClick={() => setViewingUser(user)} className={styles.linkBtn}>View</button>
                              {isArchived ? (
                                <button
                                  onClick={() => handleUnarchive(user._id)}
                                  className={`${styles.btn} ${styles.btnSuccess}`}
                                  disabled={actionLoading}
                                >
                                  Unarchive
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenConfirm(user._id)}
                                  className={`${styles.btn} ${styles.btnDanger}`}
                                  disabled={actionLoading}
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
            const isUnarchive = !!u && !!u.archived;
            
            return (
              <div className={styles.confirmCard} role="dialog" aria-modal="true">
                <div className={styles.title}>{meta.title}</div>
                <div className={styles.desc}>{meta.description}</div>
                <div className={styles.actions}>
                  <button onClick={closeConfirm} className={styles.btn} disabled={actionLoading}>
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmOpenFor && (isUnarchive ? handleUnarchive(confirmOpenFor) : handleArchive(confirmOpenFor))}
                    disabled={actionLoading}
                    className={`${styles.btn} ${isUnarchive ? styles.btnSuccess : styles.btnDanger}`}
                  >
                    {actionLoading ? (isUnarchive ? "Unarchiving..." : "Archiving...") : meta.confirmLabel}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Viewing user modal */}
          {viewingUser && (
            <div className={styles.modalBackdrop} role="dialog" aria-modal="true" onClick={() => setViewingUser(null)}>
              <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h3>User Details</h3>
                  <button onClick={() => setViewingUser(null)} className={styles.linkBtn}>
                    <i className="fa fa-times"></i> Close
                  </button>
                </div>

                <div className={styles.modalGrid}>
                  <div className={styles.labelCol}>ID</div>
                  <div className={styles.idWrapper}>
                    <span className={styles.idText}>{viewingUser.id || viewingUser._id}</span>
                    <button
                      onClick={() => copyToClipboard(viewingUser.id || viewingUser._id)}
                      className={styles.copyBtn}
                      aria-label="Copy ID"
                      title="Copy ID"
                    >
                      <i className="fa-regular fa-copy"></i> {/* ✅ Changed to fa-regular */}
                    </button>
                  </div>

                  <div className={styles.labelCol}>Name</div>
                  <div>{viewingUser.name}</div>

                  <div className={styles.labelCol}>Email</div>
                  <div>{viewingUser.email || "N/A"}</div>

                  <div className={styles.labelCol}>Location</div>
                  <div>{viewingUser.address || "No address provided"}</div>

                  <div className={styles.labelCol}>Reports</div>
                  <div>{viewingUser.reputation?.totalReports || 0}</div>

                  <div className={styles.labelCol}>Reputation Points</div>
                  <div>{viewingUser.reputation?.points || 0}</div>

                  <div className={styles.labelCol}>Level</div>
                  <div>{viewingUser.reputation?.level || 'Newcomer'}</div>

                  <div className={styles.labelCol}>Credibility</div>
                  <div>{computeCredibilityLabel(viewingUser)}</div>

                  <div className={styles.labelCol}>Status</div>
                  <div>{viewingUser.archived ? "Archived" : isActiveFromLastLogin(viewingUser.lastLogin) ? "Active" : "Inactive"}</div>

                  <div className={styles.labelCol}>Last Login</div>
                  <div>{viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleString() : "Never"}</div>
                </div>

                <div className={styles.modalActions}>
                  {viewingUser.archived ? (
                    <button
                      onClick={() => handleUnarchive(viewingUser._id)}
                      className={`${styles.btn} ${styles.btnSuccess}`}
                      disabled={actionLoading}
                    >
                      <i className="fa fa-undo" style={{ marginRight: "8px" }}></i>
                      {actionLoading ? "Unarchiving..." : "Unarchive User"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenConfirm(viewingUser._id)}
                      className={`${styles.btn} ${styles.btnDanger}`}
                      disabled={actionLoading}
                    >
                      <i className="fa fa-archive" style={{ marginRight: "8px" }}></i>
                      Archive User
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
