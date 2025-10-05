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
  status: 'Reported' | 'Processing' | 'Resolved';
  location: string;
  latitude: string;
  longitude: string;
}

type StatusFilter = 'Reported' | 'Processing' | 'Resolved' | 'All';

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({ reported: 0, processing: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('All');
  const mapRef = useRef<L.Map | null>(null);

  const profilePicUrl = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`);
        if (!res.ok) {
          throw new Error('Failed to fetch reports from API');
        }
        const data: Report[] = await res.json();
        setReports(data);

        const newStats = {
          reported: data.filter(r => r.status === 'Reported').length,
          processing: data.filter(r => r.status === 'Processing').length,
          resolved: data.filter(r => r.status === 'Resolved').length,
        };
        setStats(newStats);

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
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(map);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const reportsToShow = filterStatus === 'All'
      ? reports
      : reports.filter(report => report.status === filterStatus);

    reportsToShow.forEach((report: Report) => {
      if (report.latitude && report.longitude) {
        const marker = L.marker([parseFloat(report.latitude), parseFloat(report.longitude)], { icon: customPin }).addTo(map);
        marker.bindPopup(`
          <b>${report.title}</b><br>
          <b>Status:</b> ${report.status}<br>
          <b>Location:</b> ${report.location}
        `);
      }
    });
  }, [reports, filterStatus, customPin]);

  const handleFilterClick = (status: StatusFilter) => {
    setFilterStatus(prevStatus => (prevStatus === status ? 'All' : status));
  };

  return (
    <>
      <Head>
        <title>FixIt PH - Community Reports</title>
        <link href="https://fonts.googleapis.com/css?family=Inter" rel="stylesheet" />
        <script
          src="https://kit.fontawesome.com/830b39c5c0.js"
          crossOrigin="anonymous"
          defer
        ></script>
      </Head>

      <header>
        <nav className="admin-nav"
          style={{
            width: "100%",
            background: "white",
            color: "black",
          }}
        >
          <Image src="/images/Fix-it_logo_3.png" alt="Fixit Logo" className="logo" width={160} height={40} />
          <ul className="nav-list-user-side">
            <li style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem", 
                background: "#f0f0f0",
                }}><a href="/admin-dashboard">Dashboard</a></li>
            <li><a href="/admin-reports">Reports</a></li>
            <li>
              <a href="/admin-profile" className="admin-profile-link">
                <img src={profilePicUrl} alt="Admin Profile" className="admin-profile-pic" />
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <div id="admin-map">
        <div className="map-container">
          <div className="map-row-2" style={{ position: "relative", display: "flex" }}>
            <div className = "reports-stats">
              <div
                className={`reported ${filterStatus === 'Reported' ? 'active-card' : ''}`}
                onClick={() => handleFilterClick('Reported')}
                style={{ background: "#c92a2a", color: "#ffffff" }}
              >
                <h3>Reported</h3>
                <h1>{loading ? '...' : stats.reported}</h1>
              </div>
              <div
                className={`processing ${filterStatus === 'Processing' ? 'active-card' : ''}`}
                onClick={() => handleFilterClick('Processing')}
                style={{ background: "#c2b82a", color: "#ffffff" }}
              >
                <h3>Processing</h3>
                <h1>{loading ? '...' : stats.processing}</h1>
              </div>
              <div
                className={`resolved ${filterStatus === 'Resolved' ? 'active-card' : ''}`}
                onClick={() => handleFilterClick('Resolved')}
                style={{ background: "#3a9d49", color: "#ffffff" }}
              >
                <h3>Resolved</h3>
                <h1>{loading ? '...' : stats.resolved}</h1>
              </div>
            </div>
            <div
              id="map"
              style={{ width: "100%", height: "42rem", borderRadius: "0rem" }}
            >
            </div>
          </div>
        </div>
      </div>
    </>
  );
}