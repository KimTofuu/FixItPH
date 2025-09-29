"use client";

import { useState, useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import "../fixit-css.css";
import Image from "next/image";

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
  status: "Reported" | "Processing" | "Resolved";
  location: string;
  timestamp: string;
  description: string;
  imageUrl?: string;
  user?: User;
  comments?: Comment[];
}

type StatusFilter = "Reported" | "Processing" | "Resolved";

// ---------- Mock Data ----------
const mockData: Report[] = [
  {
    _id: "1",
    title: "Broken Streetlight",
    status: "Reported",
    location: "123 Maple St, Iba",
    timestamp: "2025-09-30T01:15:00Z",
    description: "Streetlight on the corner has been out for 3 days.",
    imageUrl: "/images/placeholder.jpg",
    user: {
      fName: "Juan",
      lName: "Dela Cruz",
      avatarUrl: "/images/sample_avatar.png",
    },
    comments: [
      {
        user: "Maria",
        text: "I also noticed this!",
        createdAt: "2025-09-30T02:00:00Z",
      },
    ],
  },
  {
    _id: "2",
    title: "Flooding on Main Road",
    status: "Processing",
    location: "456 Main Rd, Iba",
    timestamp: "2025-09-29T18:45:00Z",
    description: "Heavy flooding after rain, needs urgent attention.",
    imageUrl: "/images/placeholder.jpg",
    user: {
      fName: "Anna",
      lName: "Santos",
      avatarUrl: "/images/sample_avatar.png",
    },
    comments: [],
  },

  {
  _id: "3",
  title: "Pothole on Rizal Avenue",
  status: "Reported",
  location: "Rizal Ave, Iba",
  timestamp: "2025-09-30T05:30:00Z",
  description: "Large pothole causing traffic delays.",
  imageUrl: "/images/placeholder.jpg",
  user: {
    fName: "Carlos",
    lName: "Reyes",
    avatarUrl: "/images/sample_avatar.png",
  },
  comments: [],
},
{
  _id: "4",
  title: "Garbage not collected",
  status: "Processing",
  location: "789 Coastal Rd, Iba",
  timestamp: "2025-09-29T11:20:00Z",
  description: "Trash bins overflowing, collection delayed.",
  imageUrl: "/images/placeholder.jpg",
  user: {
    fName: "Liza",
    lName: "Garcia",
    avatarUrl: "/images/sample_avatar.png",
  },
  comments: [],
},
{
  _id: "5",
  title: "Water leak near plaza",
  status: "Resolved",
  location: "Central Plaza, Iba",
  timestamp: "2025-09-28T15:10:00Z",
  description: "Pipe burst fixed by maintenance crew.",
  imageUrl: "/images/placeholder.jpg",
  user: {
    fName: "Roberto",
    lName: "Torres",
    avatarUrl: "/images/sample_avatar.png",
  },
  comments: [
    { user: "Ana", text: "Glad this was fixed quickly!", createdAt: "2025-09-28T18:00:00Z" },
  ],
},
{
  _id: "6",
  title: "Graffiti on public wall",
  status: "Resolved",
  location: "Poblacion St, Iba",
  timestamp: "2025-09-27T09:45:00Z",
  description: "Wall has been repainted and cleaned.",
  imageUrl: "/images/placeholder.jpg",
  user: {
    fName: "Sofia",
    lName: "Cruz",
    avatarUrl: "/images/sample_avatar.png",
  },
  comments: [],
},

];

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
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("Reported");
  const [searchTerm, setSearchTerm] = useState("");

  const profilePicUrl =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // Simulate API fetch
  useEffect(() => {
    setTimeout(() => {
      setReports(mockData);
      setIsLoading(false);
    }, 500);
  }, []);

  const toggleBookmark = (id: string) => {
    console.log("Bookmark toggled for:", id);
  };

  const addComment = (reportId: string, text: string) => {
    console.log(`New comment on ${reportId}: ${text}`);
  };

  // ✅ Function to update report status
  const updateReportStatus = (reportId: string, newStatus: StatusFilter) => {
    setReports((prev) =>
      prev.map((r) =>
        r._id === reportId ? { ...r, status: newStatus } : r
      )
    );
    console.log(`Report ${reportId} status updated to ${newStatus}`);
  };

  // Filter by status + search
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => r.status === activeStatus)
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
                {(["Reported", "Processing", "Resolved"] as StatusFilter[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setActiveStatus(status)}
                      className={`toggle-button status-${status.toLowerCase()} ${
                        activeStatus === status ? "active" : ""
                      }`}
                    >
                      {status}
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
                        <option value="Reported">Reported</option>
                        <option value="Processing">Processing</option>
                        <option value="Resolved">Resolved</option>
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
