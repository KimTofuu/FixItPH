"use client";

import { useState, useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import styles from "./AdminReports.module.css";
import Image from "next/image";
import { toast } from "react-toastify";

// ---------- Types ----------
interface Comment {
  user: string;
  text: string;
  createdAt?: string;
}

interface User {
  fName: string;
  lName: string;
  avatarUrl?: string;
}

interface Report {
  _id: string;
  title: string;
<<<<<<< Updated upstream
  status: "awaiting-approval" | "pending" | "in-progress" | "resolved";
=======
  status: "pending" | "reported" | "processing" | "resolved";
>>>>>>> Stashed changes
  location: string;
  timestamp: string;
  description: string;
  imageUrl?: string;
  image?: string;
  user?: User;
  comments?: Comment[];
  // design-only: optional priority/urgency field (may come from API)
  priority?: "urgent" | "not urgent" | string;
}

<<<<<<< Updated upstream
type AdminStatusFilter = "awaiting-approval" | "pending" | "in-progress" | "resolved";
=======
type StatusFilter = "pending" | "reported" | "processing" | "resolved";
>>>>>>> Stashed changes

// ---------- Helpers ----------
const formatTimeAgo = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ---------- Component ----------
export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<AdminStatusFilter>("awaiting-approval");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const profilePicUrl =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // ---------- Fetch Reports ----------
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        let endpoint;
        if (activeStatus === "resolved") {
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/reports/admin/resolved-reports`;
        } else if (activeStatus === "awaiting-approval") {
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/reports/admin/reports-for-approval`;
        } else {
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/reports`;
        }

        const token = localStorage.getItem("token");
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          let errorMessage = `Error: ${res.statusText}`;
          try {
            // Try to parse as JSON first
            const errorData = await res.json();
            errorMessage = `Error: ${errorData.message || res.statusText}`;
          } catch (e) {
            // If JSON parsing fails, use the raw text response
            const errorText = await res.text();
            errorMessage = `Error: ${errorText || res.statusText}`;
          }
          console.error("Failed to fetch reports:", errorMessage);
          toast.error(errorMessage);
          setReports([]);
          return;
        }

        const data = await res.json();
        if (activeStatus === "resolved" || activeStatus === "awaiting-approval") {
          setReports(data);
        } else {
          const filteredData = data.filter(
            (report: Report) => report.status === activeStatus
          );
          setReports(filteredData);
        }
      } catch (err) {
        console.error("A network or other error occurred:", err);
        toast.error("Could not connect to the server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [activeStatus]);

  // ---------- Actions ----------
  const toggleBookmark = (id: string) => {
    console.log("Bookmark toggled for:", id);
  };

  const addComment = (reportId: string, text: string) => {
    console.log(`New comment on ${reportId}: ${text}`);
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        // --- CORRECTED ENDPOINT ---
        `${process.env.NEXT_PUBLIC_API_URL}/reports/admin/reports/${reportId}/approve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r._id !== reportId));
        toast.success("Report approved and moved to pending.");
      } else {
        toast.error("Failed to approve report.");
      }
    } catch (err) {
      toast.error("An error occurred while approving the report.");
    }
  };

  const handleRejectReport = async (reportId: string) => {
    if (!window.confirm("Are you sure you want to reject and delete this report?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        // Use the new admin reject endpoint
        `${process.env.NEXT_PUBLIC_API_URL}/reports/admin/reports/${reportId}/reject`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r._id !== reportId));
        toast.success("Report has been rejected and deleted.");
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to reject report.");
      }
    } catch (err) {
      console.error("Reject report error:", err);
      toast.error("An error occurred while rejecting the report.");
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: AdminStatusFilter) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/reports/${reportId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        if (newStatus === "resolved") {
          setReports((prev) => prev.filter((r) => r._id !== reportId));
          toast.success("Report resolved and moved to resolved reports!");
        } else {
          setReports((prev) =>
            prev.map((r) =>
              r._id === reportId ? { ...r, status: newStatus } : r
            )
          );
          toast.success("Report status updated");
        }
      } else {
        toast.error("Failed to update report status");
      }
    } catch (err) {
      toast.error("An error occurred while updating report status");
    }
  };

  // ---------- Filtered Reports ----------
  const filteredReports = useMemo(() => {
    let filtered: Report[] = reports ?? [];
    if (activeStatus !== "resolved" && activeStatus !== "awaiting-approval") {
      filtered = filtered.filter(
        (r) => (r.status ?? "").toLowerCase() === activeStatus.toLowerCase()
      );
    }

    const term = (searchTerm ?? "").toLowerCase().trim();
    return filtered.filter((r) => {
      const title = (r.title ?? "").toLowerCase();
      const location = (r.location ?? "").toLowerCase();
      return title.includes(term) || location.includes(term);
    });
  }, [reports, activeStatus, searchTerm]);

  // ---------- JSX ----------
  return (
    <div className={styles.adminReportsRoot}>
      {/* Header */}
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

          <div
            className={`${styles.hamburger} ${menuOpen ? styles.open : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            role="button"
            tabIndex={0}
          >
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen : ""}`} />
          </div>

          <ul className={`${styles.navListUserSide} ${menuOpen ? styles.open : ""}`}>
            <li>
              <a href="/admin-dashboard" className={styles.navLink}>Dashboard</a>
            </li>
            <li className={styles.activeNavItem}>
              <a href="/admin-reports" className={styles.navLink}>Reports</a>
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

      {/* Reports Section */}
      <div className={styles.reportsPage}>
        <main className={styles.mainContainer}>
          <div className={styles.contentCard}>
            {/* Toolbar wrapper (sticky) */}
            <div className={styles.toolbarWrapper}>
              <div className={styles.toolbar}>
                <div className={styles.toggleGroup}>
<<<<<<< Updated upstream
                  {(["awaiting-approval", "pending", "in-progress", "resolved"] as AdminStatusFilter[]).map(
=======
                  {(["pending", "reported", "processing", "resolved"] as StatusFilter[]).map(
>>>>>>> Stashed changes
                    (status) => (
                      <button
                        key={status}
                        onClick={() => setActiveStatus(status)}
                        className={[
                          styles.toggleButton,
                          styles[`status_${status.replace("-", "_")}` as keyof typeof styles],
                          activeStatus === status ? styles.active : "",
                        ].join(" ")}
                      >
                        {status.charAt(0).toUpperCase() +
                          status.slice(1).replace("-", " ")}
                      </button>
                    )
                  )}
                </div>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Search by title or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>
            </div>

            {/* Report List (scrollable only area) */}
            <div id="admin-reportList" className={styles.reportList} role="region" aria-label="Reports list">
              {isLoading ? (
                <p className={styles.loadingText}>Loading reports...</p>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((r) => (
                  <div className={styles.adminReportCard} key={r._id}>
                    <div className={styles.reportsRow}>
                      <div className={styles.reportMain}>
                        <div className={styles.reportHeader}>
                          <Image
                            src={
                              r.user?.avatarUrl || "/images/sample_avatar.png"
                            }
                            className={styles.reportAvatar}
                            alt="Avatar"
                            width={40}
                            height={40}
                          />
                          <div className={styles.userMeta}>
                            <span className={styles.reportUser}>
                              {r.user?.fName} {r.user?.lName}
                            </span>
                            <span className={styles.reportTime}>
                              {formatTimeAgo(r.timestamp)}
                            </span>
                          </div>
                          <button
                            id={`bookmark-${r._id}`}
                            className={styles.bookmarkBtn}
                            onClick={() => toggleBookmark(r._id)}
                          >
                            <i className="fa-regular fa-bookmark" />
                          </button>
                        </div>

                        <h3 className={styles.reportTitle}>{r.title}</h3>
                        <p className={styles.reportLocation}>
                          <i className="fa-solid fa-location-dot" /> {r.location}
                        </p>
                        <p className={styles.reportDetails}>{r.description}</p>

<<<<<<< Updated upstream
                        {activeStatus === "awaiting-approval" ? (
                          <div className={styles.approvalActions}>
                            <button
                              onClick={() => handleApproveReport(r._id)}
                              className={`${styles.actionBtn} ${styles.approveBtn}`}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectReport(r._id)}
                              className={`${styles.actionBtn} ${styles.rejectBtn}`}
=======
                        <div className={styles.urgencyRow}>
                          <label className={styles.urgencyLabel}>Urgency</label>
                          <div
                            className={`${styles.urgencyValue} ${
                              r.priority === "urgent"
                                ? styles.urgent
                                : r.priority === "not urgent"
                                ? styles.notUrgent
                                : ""
                            }`}
                            aria-label="Report urgency"
                          >
                            {r.priority ?? "not urgent"}
                          </div>
                        </div>

                        {activeStatus === "pending" && (
                          <div className={styles.pendingControls}>
                            <button
                              className={styles.acceptBtn}
                              onClick={() => updateReportStatus(r._id, "reported")}
                              aria-label={`Accept report ${r._id}`}
                            >
                              Accept
                            </button>

                            <button
                              className={styles.rejectBtn}
                              onClick={() =>
                                setReports((prev) => prev.filter((rep) => rep._id !== r._id))
                              }
                              aria-label={`Reject report ${r._id}`}
>>>>>>> Stashed changes
                            >
                              Reject
                            </button>
                          </div>
<<<<<<< Updated upstream
                        ) : (
                          <div className={styles.statusControl}>
                            <label className={styles.statusLabel}>Status</label>
                            <select
                              value={r.status}
                              onChange={(e) =>
                                updateReportStatus(
                                  r._id,
                                  e.target.value as AdminStatusFilter
                                )
                              }
                              className={styles.statusSelect}
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">Processing</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                        )}
=======
                        )}

                        <div className={styles.statusControl}>
                          <label className={styles.statusLabel}>Status</label>
                          <select
                            value={activeStatus === "resolved" ? "resolved" : r.status}
                            onChange={(e) =>
                              updateReportStatus(r._id, e.target.value as StatusFilter)
                            }
                            className={styles.statusSelect}
                          >
                            <option value="pending">Pending</option>
                            <option value="reported">Reported</option>
                            <option value="processing">Processing</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>
>>>>>>> Stashed changes
                      </div>

                      <div className={styles.reportImage}>
                        {r.imageUrl || r.image ? (
                          <img
                            src={r.imageUrl ?? (r as any).image}
                            alt="Report Image"
                            className={styles.inlineImage}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/images/broken-streetlights.jpg";
                            }}
                          />
                        ) : (
                          <img
                            src={"/images/broken-streetlights.jpg"}
                            alt="Report Image"
                            className={styles.inlineImage}
                          />
                        )}
                      </div>
                    </div>

                    <div className={styles.reportComments}>
                      <h4 className={styles.commentsTitle}>Comments</h4>
                      <ul className={styles.commentList}>
                        {(r.comments ?? []).map((c, idx) => (
                          <li key={idx} className={styles.commentItem}>
                            <b>{c.user}:</b> {c.text}
                            {c.createdAt && (
                              <span className={styles.commentTime}>
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <input
                        type="text"
                        className={styles.commentInput}
                        placeholder="Add a comment..."
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            e.currentTarget.value.trim() !== ""
                          ) {
                            addComment(r._id, e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.noReportsText}>No reports found</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
