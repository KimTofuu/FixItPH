"use client";

import { useState, useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import "../fixit-css.css";
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
  status: "pending" | "in-progress" | "resolved";
  location: string;
  timestamp: string;
  description: string;
  imageUrl?: string;
  user?: User;
  comments?: Comment[];
}

type StatusFilter = "pending" | "in-progress" | "resolved";

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
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const profilePicUrl =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`);
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        }
      } finally {
        setIsLoading(false); // <-- Always set loading to false
      }
    };
    fetchReports();
  }, []);

  const toggleBookmark = (id: string) => {
    console.log("Bookmark toggled for:", id);
  };

  const addComment = (reportId: string, text: string) => {
    console.log(`New comment on ${reportId}: ${text}`);
  };

  // ✅ Function to update report status
  const updateReportStatus = async (reportId: string, newStatus: StatusFilter) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/${reportId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        if (newStatus === 'resolved') {
          // Remove from current reports list
          setReports((prev) => prev.filter(r => r._id !== reportId));
          toast.success("Report resolved and moved to resolved reports!");
        } else {
          // Update status normally
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

  // Filter by status + search
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => r.status.toLowerCase() === activeStatus.toLowerCase())
      .filter(
        (r) =>
          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [reports, activeStatus, searchTerm]);

  return (
    <>
      {/* Header */}
      <header>
        <nav
          className="admin-nav"
          style={{ width: "100%", background: "white", color: "black" }}
        >
          <Image
            src="/images/Fix-it_logo_3.png"
            alt="Fixit Logo"
            className="logo"
            width={160}
            height={40}
          />
          <ul className="nav-list-user-side">
            <li>
              <a href="/admin-dashboard">Dashboard</a>
            </li>
            <li
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "#f0f0f0",
              }}
            >
              <a href="/admin-reports">Reports</a>
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

      {/* Reports Section */}
      <div className="reports-page">
        <main className="main-container">
          <div className="content-card">
            {/* Toolbar */}
            <div className="toolbar">
              <div className="toggle-group">
                {(["pending", "in-progress", "resolved"] as StatusFilter[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setActiveStatus(status)}
                      className={`toggle-button status-${status} ${
                        activeStatus === status ? "active" : ""
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                    </button>
                  )
                )}
              </div>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search by title or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* Report List */}
            <div id="admin-reportList">
              {isLoading ? (
                <p>Loading reports...</p>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((r) => (
                  <div className="admin-report-card" key={r._id}>
                    <div style={{ display:"flex", flexDirection: "row", justifyContent: "space-between"}} > 
                    <div>
                    {/* Header */}
                    <div className="report-header">
                      <Image
                        src={r.user?.avatarUrl || "/images/sample_avatar.png"}
                        className="report-avatar"
                        alt="Avatar"
                        width={40}
                        height={40}
                      />
                      <span className="report-user">
                        {r.user?.fName} {r.user?.lName}
                      </span>
                      <button
                        id={`bookmark-${r._id}`}
                        className="bookmark-btn"
                        onClick={() => toggleBookmark(r._id)}
                      >
                        <i className="fa-regular fa-bookmark"></i>
                      </button>
                    </div>

                    {/* Body */}
                    <h3 className="report-title">{r.title}</h3>
                    <p className="report-location">
                      <i className="fa-solid fa-location-dot"></i> {r.location}
                    </p>
                    <p className="report-details">{r.description}</p>

                    {/* ✅ Status Dropdown */}
                    <div className="status-control">
                      <label>Status: </label>
                      <select
                        value={r.status}
                        onChange={(e) =>
                          updateReportStatus(r._id, e.target.value as StatusFilter)
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">Processing</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    </div>
                    {/* Image */}
                    <div className="report-image">
                      <img
                        src={"/images/broken-streetlights.jpg"}
                        alt="Report Image"
                        width={500}
                        height={250}
                      />
                    </div>
                    </div>
                    {/* Comments */}
                    <div className="report-comments">
                      <h4>Comments</h4>
                      <ul className="comment-list">
                        {(r.comments ?? []).map((c, idx) => (
                          <li key={idx}>
                            <b>{c.user}:</b> {c.text}
                            {c.createdAt && (
                              <span
                                style={{
                                  color: "#888",
                                  marginLeft: 8,
                                  fontSize: "0.9em",
                                }}
                              >
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <input
                        type="text"
                        className="comment-input"
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
                <p style={{ color: "red", marginTop: "10px" }}>
                  No reports found
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
