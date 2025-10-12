// app/admin-dashboard/page.tsx (or the file you provided)
// Only change: added "Users" link in the nav list. No functions touched.
"use client";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./admin-dashboard.css";
import Image from "next/image";

interface Report {
  id: number;
  title: string;
  status: "Reported" | "Processing" | "Resolved";
  location: string;
  latitude?: string;
  longitude?: string;
}

type StatusFilter = "Reported" | "Processing" | "Resolved" | "All";

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [resolvedReports, setResolvedReports] = useState<Report[]>([]); // <-- new
  const [stats, setStats] = useState({
    reported: 0,
    processing: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const profilePicUrl =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const customPin = L.icon({
    iconUrl: "/images/pin.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "/images/marker-shadow.png",
    shadowSize: [41, 41],
  });

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [resAll, resResolved] = await Promise.allSettled([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/resolvedReports`),
        ]);

        if (resAll.status !== "fulfilled" || !resAll.value.ok) {
          throw new Error("Failed to fetch reports from API");
        }

        const data: any[] = await resAll.value.json();

        const normalizeStatus = (s?: string) => {
          if (!s) return "Reported";
          const lower = s.toLowerCase();
          if (lower === "pending" || lower === "reported") return "Reported";
          if (lower === "in-progress" || lower === "processing") return "Processing";
          if (lower === "resolved") return "Resolved";
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        };

        const transformed: Report[] = data.map((r) => ({
          id: r._id || r.id,
          title: r.title || r.subject || "No title",
          status: normalizeStatus((r as any).status) as Report["status"],
          location: r.location || r.address || "",
          latitude: r.latitude?.toString?.() || r.lat?.toString?.() || "",
          longitude: r.longitude?.toString?.() || r.lng?.toString?.() || "",
        }));

        setReports(transformed);

        // handle resolved list
        let resolvedCount = 0;
        if (resResolved.status === "fulfilled" && resResolved.value.ok) {
          try {
            const resolvedData = await resResolved.value.json();
            const resolvedTransformed: Report[] = Array.isArray(resolvedData)
              ? resolvedData.map((r: any) => ({
                  id: r._id || r.id,
                  title: r.title || r.subject || "No title",
                  status: "Resolved",
                  location: r.location || r.address || "",
                  latitude: r.latitude?.toString?.() || r.lat?.toString?.() || "",
                  longitude: r.longitude?.toString?.() || r.lng?.toString?.() || "",
                }))
              : [];
            setResolvedReports(resolvedTransformed);
            resolvedCount = resolvedTransformed.length;
          } catch {
            setResolvedReports([]);
            resolvedCount = transformed.filter((r) => r.status === "Resolved").length;
          }
        } else {
          setResolvedReports([]);
          resolvedCount = transformed.filter((r) => r.status === "Resolved").length;
        }

        setStats({
          reported: transformed.filter((r) => r.status === "Reported").length,
          processing: transformed.filter((r) => r.status === "Processing").length,
          resolved: resolvedCount,
        });
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map("map").setView([14.8292, 120.2828], 13);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(map);
  }, []);

  // map markers: use resolvedReports when showing Resolved; when All, merge reports + resolvedReports
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    let reportsToShow: Report[] = [];
    if (filterStatus === "Resolved") {
      reportsToShow = resolvedReports;
    } else if (filterStatus === "All") {
      // combine reports (non-resolved) with resolvedReports (separate collection)
      const nonResolved = reports.filter((r) => r.status !== "Resolved");
      reportsToShow = [...nonResolved, ...resolvedReports];
    } else {
      reportsToShow = reports.filter((report) => report.status === filterStatus);
    }

    reportsToShow.forEach((report: Report) => {
      if (report.latitude && report.longitude) {
        const lat = parseFloat(report.latitude as string);
        const lng = parseFloat(report.longitude as string);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const marker = L.marker([lat, lng], { icon: customPin }).addTo(map);
        marker.bindPopup(`
          <b>${report.title}</b><br>
          <b>Status:</b> ${report.status}<br>
          <b>Location:</b> ${report.location}
        `);
      }
    });
  }, [reports, resolvedReports, filterStatus, customPin]);

  const handleFilterClick = (status: StatusFilter) => {
    setFilterStatus((prevStatus) => (prevStatus === status ? "All" : status));
  };

  return (
    <>
      <Head>
        <title>FixIt PH - Admin Dashboard</title>
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
            <li
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "#f0f0f0",
              }}
            >
              <a href="/admin-dashboard">Dashboard</a>
            </li>
            <li>
              <a href="/admin-reports">Reports</a>
            </li>

            {/* NEW Users link added for admin user list navigation (design only) */}
            <li>
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

      <div id="admin-map">
        <div className="map-container">
          <div className="map-row-2" style={{ position: "relative", display: "flex" }}>
            <div className="reports-stats">
              <div
                className={`reported ${
                  filterStatus === "Reported" ? "active-card" : ""
                }`}
                onClick={() => handleFilterClick("Reported")}
                style={{ background: "#c92a2a", color: "#ffffff" }}
              >
                <h3>Reported</h3>
                <h1>{loading ? "..." : stats.reported}</h1>
              </div>
              <div
                className={`processing ${
                  filterStatus === "Processing" ? "active-card" : ""
                }`}
                onClick={() => handleFilterClick("Processing")}
                style={{ background: "#c2b82a", color: "#ffffff" }}
              >
                <h3>Processing</h3>
                <h1>{loading ? "..." : stats.processing}</h1>
              </div>
              <div
                className={`resolved ${
                  filterStatus === "Resolved" ? "active-card" : ""
                }`}
                onClick={() => handleFilterClick("Resolved")}
                style={{ background: "#3a9d49", color: "#ffffff" }}
              >
                <h3>Resolved</h3>
                <h1>{loading ? "..." : stats.resolved}</h1>
              </div>
            </div>
            <div
              id="map"
              style={{ width: "100%", height: "42rem", borderRadius: "0rem" }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
}
