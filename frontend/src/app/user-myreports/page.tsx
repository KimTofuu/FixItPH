"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "../fixit-css.css";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface Report {
  _id: string;
  user: {
    fName: string;
    lName: string;
  };
  title: string;
  location: string;
  description: string;
  status: "Pending" | "In Progress";
  image: string;
  comments: { author: string; text: string }[];
}

export default function UserMyReportsPage() {
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const myReports = await res.json();
        setReports(myReports);
      }
    };
    fetchReports();
  }, []);

  // Profile picture (dynamic check)
  const userPhoto: string | null = null;
  const profilePic = userPhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // Add comment handler
  const handleComment = (index: number, comment: string) => {
    if (!comment.trim()) return;
    const updatedReports = [...reports];
    updatedReports[index].comments.push({ author: "You", text: comment });
    setReports(updatedReports);
  };

  const handleDelete = async (reportId: string, index: number) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${reportId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      // Remove from local state
      const updatedReports = reports.filter((_, i) => i !== index);
      setReports(updatedReports);
      toast.success("Report deleted successfully!");
    } else {
      toast.error("Failed to delete report");
    }
  };

  // Search filter
  const filteredReports = reports.filter((r) => {
    const text = `${r.user} ${r.title} ${r.location} ${r.description}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

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
              <Link href="/user-profile" className="profile-link">
                <Image src={profilePic} alt="User Profile" className="profile-pic" width={40} height={40} />
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* MY REPORTS */}
      <div id="user-myreports">
        <div className="myreports-container">
          <div className="myreports-column-1">
            <div className="myreports-search">
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div id="reportList">
              {filteredReports.length > 0 ? (
                filteredReports.map((report, i) => (
                  <div key={i} className="report-card">
                    {/* Header */}
                    <div className="report-header">
                      <Image
                        src="/images/sample_avatar.png"
                        alt="Avatar"
                        className="report-avatar"
                        width={32}
                        height={32}
                      />
                      <span className="report-user">{report.user.fName} {report.user.lName}</span>
                    </div>

                    {/* Report Content */}
                    <h3 className="report-title">{report.title}</h3>
                    <p className="report-location">
                      <i className="fa-solid fa-location-dot"></i> {report.location}
                    </p>
                    <p className="report-details">{report.description}</p>
                    <span className={`report-status ${report.status.toLowerCase().replace(" ", "-")}`}>
                      {report.status}
                    </span>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDelete(report._id, i)}
                      style={{ 
                        marginLeft: "10px", 
                        backgroundColor: "#ff4444", 
                        color: "white", 
                        border: "none", 
                        padding: "5px 10px", 
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                    <br></br><br></br>

                    {/* Report Image */}
                    <div className="report-image">
                      <Image src={"/images/broken-streetlights.jpg"} alt="Report Image" width={800} height={500} />
                    </div>

                    {/* Comments */}
                    <div className="report-comments">
                      <h4>Comments</h4>
                      <ul className="comment-list">
                        {(report.comments ?? []).map((c, j) => (
                          <li key={j}>
                            <b>{c.author}:</b> {c.text}
                          </li>
                        ))}
                      </ul>
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Add a comment..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleComment(i, (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p id="noResults" style={{ color: "red", marginTop: "10px" }}>
                  No reports found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
