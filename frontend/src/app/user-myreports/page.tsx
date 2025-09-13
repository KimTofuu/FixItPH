"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "../fixit-css.css";

interface Report {
  user: string;
  title: string;
  location: string;
  details: string;
  status: "Pending" | "In Progress";
  image: string;
  comments: { author: string; text: string }[];
}

export default function UserMyReportsPage() {
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState<Report[]>([
    {
      user: "Juan Dela Cruz",
      title: "Broken Streetlight",
      location: "Magsaysay Drive, Olongapo City",
      details: "The streetlight has been broken for over a week, making it unsafe at night.",
      status: "Pending",
      image: "/streetlight.jpg",
      comments: [{ author: "Ana", text: "I pass here daily, it’s really dark at night." }],
    },
    {
      user: "Maria Santos",
      title: "Uncollected Garbage",
      location: "Rizal Avenue, Olongapo City",
      details: "Garbage has not been collected for three days and is starting to smell bad.",
      status: "In Progress",
      image: "/garbage.jpg",
      comments: [{ author: "Pedro", text: "I also noticed this, it’s becoming unhygienic." }],
    },
  ]);

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

  // Search filter
  const filteredReports = reports.filter((r) => {
    const text = `${r.user} ${r.title} ${r.location} ${r.details}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div>
      {/* HEADER */}
      <header>
        <nav>
          <Image src="/images/Fix t_5.png" alt="FixIt Logo" className="logo" width={120} height={50} />
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
                        src="/default-user.png"
                        alt="Avatar"
                        className="report-avatar"
                        width={32}
                        height={32}
                      />
                      <span className="report-user">{report.user}</span>
                    </div>

                    {/* Report Content */}
                    <h3 className="report-title">{report.title}</h3>
                    <p className="report-location">
                      <i className="fa-solid fa-location-dot"></i> {report.location}
                    </p>
                    <p className="report-details">{report.details}</p>
                    <span className={`report-status ${report.status.toLowerCase().replace(" ", "-")}`}>
                      {report.status}
                    </span>

                    {/* Report Image */}
                    <div className="report-image">
                      <Image src={report.image} alt="Report Image" width={400} height={250} />
                    </div>

                    {/* Comments */}
                    <div className="report-comments">
                      <h4>Comments</h4>
                      <ul className="comment-list">
                        {report.comments.map((c, j) => (
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
