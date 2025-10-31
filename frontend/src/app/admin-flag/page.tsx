"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Head from "next/head";
import Image from "next/image";
import styles from "./admin-flag.module.css";

interface User {
  _id: string;
  fName: string;
  lName: string;
  email: string;
  profilePicture?: {
    url?: string;
  };
}

interface Flag {
  userId: {
    _id: string;
    fName: string;
    lName: string;
    email: string;
  };
  reason: string;
  description: string;
  createdAt: string;
}

interface FlaggedReport {
  _id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  status: string;
  image?: string;
  images?: string[];
  user: User;
  flags: Flag[];
  flagCount: number;
  createdAt: string;
  helpfulVotes?: number;
}

export default function AdminFlagPage() {
  const router = useRouter();
  const [flaggedReports, setFlaggedReports] = useState<FlaggedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<FlaggedReport | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [filterReason, setFilterReason] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Add this
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const profilePicUrl = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const flagReasons = [
    "Spam or misleading information",
    "Inappropriate content",
    "Duplicate report",
    "False or fabricated issue",
    "Not a community issue",
    "Already resolved",
    "Other"
  ];

  useEffect(() => {
    // Simplified authentication check - same as other admin pages
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      
      console.log("🔐 Checking authentication...");
      console.log("Token:", token ? "exists" : "missing");

      if (!token) {
        console.log("❌ No token, redirecting to login");
        toast.error("Please login first");
        router.push("/login");
        return false;
      }

      // If there's a token, assume they're authenticated
      // The backend will verify if they're actually admin
      console.log("✅ Authentication passed");
      return true;
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      const isAuth = checkAuth();
      if (isAuth) {
        setIsAuthenticated(true);
        fetchFlaggedReports();
      }
    }
  }, []);

  const fetchFlaggedReports = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      console.log("📡 Fetching from:", `${API}/reports/admin/flagged-reports`);
      console.log("📡 Using token:", token?.substring(0, 20) + "...");
      
      const res = await fetch(`${API}/reports/admin/flagged-reports`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      console.log("📡 Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error response:", errorText);
        
        if (res.status === 401 || res.status === 403) {
          toast.error("Session expired. Please login again.");
          localStorage.clear();
          router.push("/login");
          return;
        }
        
        throw new Error(`Failed to fetch flagged reports: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Fetched data:", data.length, "reports");
      setFlaggedReports(data);
    } catch (error) {
      console.error("❌ Error fetching flagged reports:", error);
      toast.error("Failed to load flagged reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissFlag = async (reportId: string, flagUserId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/reports/admin/${reportId}/dismiss-flag`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ flagUserId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Flag dismissed successfully");
        fetchFlaggedReports();
        if (selectedReport?._id === reportId) {
          setDetailsModalVisible(false);
          setSelectedReport(null);
        }
      } else {
        toast.error(data.message || "Failed to dismiss flag");
      }
    } catch (error) {
      console.error("Error dismissing flag:", error);
      toast.error("An error occurred");
    }
  };

  const handleRemoveReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to remove this report? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Use the admin-specific delete endpoint
      const res = await fetch(`${API}/admin/reports/${reportId}/delete-flagged`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Report removed successfully");
        fetchFlaggedReports();
        setDetailsModalVisible(false);
        setSelectedReport(null);
      } else {
        toast.error(data.message || "Failed to remove report");
      }
    } catch (error) {
      console.error("Error removing report:", error);
      toast.error("An error occurred");
    }
  };

  const handleDismissAllFlags = async (reportId: string) => {
    if (!confirm("Are you sure you want to dismiss all flags for this report?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/reports/admin/${reportId}/dismiss-all-flags`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("All flags dismissed successfully");
        fetchFlaggedReports();
        setDetailsModalVisible(false);
        setSelectedReport(null);
      } else {
        toast.error(data.message || "Failed to dismiss flags");
      }
    } catch (error) {
      console.error("Error dismissing all flags:", error);
      toast.error("An error occurred");
    }
  };

  const openDetailsModal = (report: FlaggedReport) => {
    setSelectedReport(report);
    setDetailsModalVisible(true);
  };

  const filteredReports = flaggedReports.filter((report) => {
    if (filterReason === "all") return true;
    return report.flags.some((flag) => flag.reason === filterReason);
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#f59e0b";
      case "in-progress":
        return "#3b82f6";
      case "resolved":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  // Don't render anything until authentication is checked
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
        <title>FixIt PH - Flagged Reports</title>
        <link
          href="https://fonts.googleapis.com/css?family=Inter"
          rel="stylesheet"
        />
        <script
          src="https://kit.fontawesome.com/830b39c5c0.js"
          crossOrigin="anonymous"
          defer
        ></script>
      </Head>

      <div className={styles.adminFlagRoot}>
        <header className={styles.navHeader}> {/* Changed from .header to .navHeader */}
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

        <div className={styles.flagPage}>
          <main className={styles.mainContainer}>
            <div className={styles.contentCard}>
              <div className={styles.pageHeader}> {/* Changed from .header to .pageHeader */}
                <div>
                  <h1 className={styles.pageTitle}>
                    <i className="fa-solid fa-flag" style={{ marginRight: "12px", color: "#ef4444" }}></i>
                    Flagged Reports
                  </h1>
                  <p className={styles.subtitle}>
                    Review and manage reports flagged by the community
                  </p>
                </div>
                <div className={styles.stats}>
                  <div className={styles.statCard}>
                    <i className="fa-solid fa-flag"></i>
                    <div>
                      <div className={styles.statNumber}>{flaggedReports.length}</div>
                      <div className={styles.statLabel}>Flagged Reports</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.filterSection}>
                <label htmlFor="reasonFilter" className={styles.filterLabel}>
                  Filter by reason:
                </label>
                <select
                  id="reasonFilter"
                  className={styles.filterSelect}
                  value={filterReason}
                  onChange={(e) => setFilterReason(e.target.value)}
                >
                  <option value="all">All Reasons ({flaggedReports.length})</option>
                  {flagReasons.map((reason) => {
                    const count = flaggedReports.filter((r) =>
                      r.flags.some((f) => f.reason === reason)
                    ).length;
                    return (
                      <option key={reason} value={reason}>
                        {reason} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className={styles.reportList}>
                {isLoading ? (
                  <div className={styles.loadingState}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "32px", color: "#3b82f6" }}></i>
                    <p>Loading flagged reports...</p>
                  </div>
                ) : filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <div className={styles.flagCard} key={report._id}>
                      <div className={styles.flagCardHeader}>
                        <div className={styles.reportInfo}>
                          <h3 className={styles.reportTitle}>{report.title}</h3>
                          <div className={styles.reportMeta}>
                            <span className={styles.metaItem}>
                              <i className="fa-solid fa-user"></i>
                              {report.user.fName} {report.user.lName}
                            </span>
                            <span className={styles.metaItem}>
                              <i className="fa-solid fa-location-dot"></i>
                              {report.location}
                            </span>
                            <span className={styles.metaItem}>
                              <i className="fa-solid fa-clock"></i>
                              {formatTimeAgo(report.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className={styles.flagBadge}>
                          <i className="fa-solid fa-flag"></i>
                          {report.flagCount} {report.flagCount === 1 ? "Flag" : "Flags"}
                        </div>
                      </div>

                      <p className={styles.reportDescription}>{report.description}</p>

                      <div className={styles.flagsList}>
                        <h4 className={styles.flagsTitle}>Flags:</h4>
                        {report.flags.slice(0, 2).map((flag, index) => (
                          <div className={styles.flagItem} key={index}>
                            <div className={styles.flagHeader}>
                              <span className={styles.flagUser}>
                                <i className="fa-solid fa-user-circle"></i>
                                {flag.userId.fName} {flag.userId.lName}
                              </span>
                              <span className={styles.flagTime}>
                                {formatTimeAgo(flag.createdAt)}
                              </span>
                            </div>
                            <div className={styles.flagReason}>
                              <i className="fa-solid fa-circle-exclamation"></i>
                              {flag.reason}
                            </div>
                            {flag.description && (
                              <div className={styles.flagDescription}>
                                "{flag.description}"
                              </div>
                            )}
                          </div>
                        ))}
                        {report.flags.length > 2 && (
                          <p className={styles.moreFlagsText}>
                            +{report.flags.length - 2} more flag{report.flags.length - 2 > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          className={styles.viewDetailsBtn}
                          onClick={() => openDetailsModal(report)}
                        >
                          <i className="fa-solid fa-eye"></i>
                          View Details
                        </button>
                        <button
                          className={styles.dismissAllBtn}
                          onClick={() => handleDismissAllFlags(report._id)}
                        >
                          <i className="fa-solid fa-check"></i>
                          Dismiss All
                        </button>
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleRemoveReport(report._id)}
                        >
                          <i className="fa-solid fa-trash"></i>
                          Remove Report
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <i className="fa-solid fa-flag" style={{ fontSize: "64px", color: "#cbd5e1" }}></i>
                    <h3>No Flagged Reports</h3>
                    <p>There are no reports matching your filter criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Details Modal */}
        {detailsModalVisible && selectedReport && (
          <div className={styles.modal} onClick={() => setDetailsModalVisible(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.closeBtn}
                onClick={() => setDetailsModalVisible(false)}
              >
                &times;
              </button>

              <h2 className={styles.modalTitle}>
                <i className="fa-solid fa-file-lines"></i>
                Report Details
              </h2>

              <div className={styles.modalBody}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Report Information</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <strong>Title:</strong>
                      <span>{selectedReport.title}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Category:</strong>
                      <span>{selectedReport.category}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Location:</strong>
                      <span>{selectedReport.location}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Status:</strong>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(selectedReport.status) }}
                      >
                        {selectedReport.status}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Reported by:</strong>
                      <span>
                        {selectedReport.user.fName} {selectedReport.user.lName}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Helpful Votes:</strong>
                      <span>{selectedReport.helpfulVotes || 0}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem} style={{ marginTop: '12px' }}>
                    <strong>Description:</strong>
                    <p style={{ marginTop: '8px', lineHeight: '1.6' }}>
                      {selectedReport.description}
                    </p>
                  </div>
                </div>

                {selectedReport.image && (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Image</h3>
                    <img
                      src={selectedReport.image}
                      alt="Report"
                      className={styles.reportImage}
                    />
                  </div>
                )}

                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    All Flags ({selectedReport.flags.length})
                  </h3>
                  <div className={styles.flagsDetailList}>
                    {selectedReport.flags.map((flag, index) => (
                      <div className={styles.flagDetailItem} key={index}>
                        <div className={styles.flagDetailHeader}>
                          <div>
                            <strong>{flag.userId.fName} {flag.userId.lName}</strong>
                            <span className={styles.flagDetailEmail}>
                              ({flag.userId.email})
                            </span>
                          </div>
                          <span className={styles.flagDetailTime}>
                            {new Date(flag.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className={styles.flagDetailReason}>
                          <strong>Reason:</strong> {flag.reason}
                        </div>
                        {flag.description && (
                          <div className={styles.flagDetailDesc}>
                            <strong>Details:</strong> {flag.description}
                          </div>
                        )}
                        <button
                          className={styles.dismissFlagBtn}
                          onClick={() => handleDismissFlag(selectedReport._id, flag.userId._id)}
                        >
                          <i className="fa-solid fa-times"></i>
                          Dismiss this flag
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.modalDismissBtn}
                  onClick={() => handleDismissAllFlags(selectedReport._id)}
                >
                  Dismiss All Flags
                </button>
                <button
                  className={styles.modalRemoveBtn}
                  onClick={() => handleRemoveReport(selectedReport._id)}
                >
                  Remove Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}