// pages/index.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../fixit-css.css";
import Image from "next/image";


interface Report {
  id: number;
  user: string;
  title: string;
  details: string;
  status: string;
  address: string;
  image: string;
  comments: { user: string; text: string }[];
}

export default function UserFeedPage() {
  const modalMapRef = useRef<HTMLDivElement>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMarker, setModalMarker] = useState<L.Marker | null>(null);
  const [modalMap, setModalMap] = useState<L.Map | null>(null);

  const [reports, setReports] = useState<Report[]>([
    {
      id: 1,
      user: "Juan Dela Cruz",
      title: "Broken Streetlight",
      details: "The streetlight has been broken for over a week, making it unsafe at night.",
      status: "Pending",
      address: "Magsaysay Drive, Olongapo City",
      image: "/streetlight.jpg",
      comments: [{ user: "Ana", text: "I pass here daily, it’s really dark at night." }],
    },
    {
      id: 2,
      user: "Maria Santos",
      title: "Uncollected Garbage",
      details: "Garbage has not been collected for three days and is starting to smell bad.",
      status: "In Progress",
      address: "Rizal Avenue, Olongapo City",
      image: "/garbage.jpg",
      comments: [{ user: "Pedro", text: "I also noticed this, it’s becoming unhygienic." }],
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = reports.filter((r) =>
    `${r.user} ${r.title} ${r.address} ${r.details}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Custom pin icon
  const customPin = L.icon({
    iconUrl: "/images/pin.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  // Modal Map setup
  useEffect(() => {
    if (modalVisible && modalMapRef.current && !modalMap) {
      const map = L.map(modalMapRef.current).setView([14.8292, 120.2828], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      setModalMap(map);

      map.on("click", async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        if (modalMarker) {
          modalMarker.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { icon: customPin }).addTo(map);
          setModalMarker(marker);
        }

        const latInput = document.getElementById("latitude") as HTMLInputElement;
        const lngInput = document.getElementById("longitude") as HTMLInputElement;
        latInput.value = lat.toString();
        lngInput.value = lng.toString();

        const addressInput = document.getElementById("address") as HTMLInputElement;
        const address = await getAddressFromCoords(lat, lng);
        addressInput.value = address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      });
    }
  }, [modalVisible, modalMap, modalMarker]);

  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      return data.display_name;
    } catch {
      return null;
    }
  };

  const getCoordsFromAddress = async (address: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await res.json();
      if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      return null;
    } catch {
      return null;
    }
  };

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    const coords = await getCoordsFromAddress(address);
    if (coords && modalMap) {
      if (modalMarker) {
        modalMarker.setLatLng([coords.lat, coords.lng]);
      } else {
        const marker = L.marker([coords.lat, coords.lng], { icon: customPin }).addTo(modalMap);
        setModalMarker(marker);
      }
      modalMap.setView([coords.lat, coords.lng], 16);

      const latInput = document.getElementById("latitude") as HTMLInputElement;
      const lngInput = document.getElementById("longitude") as HTMLInputElement;
      latInput.value = coords.lat.toString();
      lngInput.value = coords.lng.toString();
    }
  };

  const toggleBookmark = (reportId: number) => {
    const btn = document.querySelector(`#bookmark-${reportId} i`);
    if (btn) {
      btn.classList.toggle("fa-regular");
      btn.classList.toggle("fa-solid");
    }
  };

  const addComment = (reportId: number, text: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, comments: [...r.comments, { user: "You", text }] } : r
      )
    );
  };

  return (
    <>
      <Head>
        <title>FixIt PH - Community Reports</title>
        <link href="https://fonts.googleapis.com/css?family=Inter" rel="stylesheet" />
        <script src="https://kit.fontawesome.com/830b39c5c0.js" crossOrigin="anonymous"></script>
      </Head>

      <header>
        <nav>
          <Image src="/images/Fix-it_logo_2.png" alt="Fixit Logo" className="logo" width={160} height={40} />
          <ul className="nav-list-user-side">
            <li><a href="/user-map">Map</a></li>
            <li><a href="/user-feed">Feed</a></li>
            <li><a href="user-myreports">My Reports</a></li>
            <li>
              <a href="/user-profile" className="profile-link">
                <img
                  id="profilePic"
                  src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  alt="User Profile"
                  className="profile-pic"
                />
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <div id="user-feed">
        <div className="feed-container">
          <div className="feed-column-1">
            <div className="feed-button-search">
              <button className="report-btn" onClick={() => setModalVisible(true)}>+ Add Report</button>
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div id="reportList">
              {filteredReports.length > 0 ? (
                filteredReports.map((r) => (
                  <div className="report-card" key={r.id}>
                    <div className="report-header">
                      <img src="/images/sample_avatar.png" className="report-avatar" alt="Avatar" />
                      <span className="report-user">{r.user}</span>
                      <button id={`bookmark-${r.id}`} className="bookmark-btn" onClick={() => toggleBookmark(r.id)}>
                        <i className="fa-regular fa-bookmark"></i>
                      </button>
                    </div>

                    <h3 className="report-title">{r.title}</h3>
                    <p className="report-location"><i className="fa-solid fa-location-dot"></i> {r.address}</p>
                    <p className="report-details">{r.details}</p>
                    <span className={`report-status ${r.status.toLowerCase().replace(" ", "-")}`}>{r.status}</span>

                    <div className="report-image"><Image src={"/images/broken-streetlights.jpg"} alt="Report Image" width={600} height={350} /></div>

                    <div className="report-comments">
                      <h4>Comments</h4>
                      <ul className="comment-list">
                        {r.comments.map((c, idx) => (
                          <li key={idx}><b>{c.user}:</b> {c.text}</li>
                        ))}
                      </ul>
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Add a comment..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value.trim() !== "") {
                            addComment(r.id, e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "red", marginTop: "10px" }}>No reports found</p>
              )}
            </div>
          </div>

          <div className="feed-column-2">
            <h1>Bookmarks</h1>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalVisible && (
        <div className="modal" style={{ display: "flex" }}>
          <div className="modal-content">
            <span className="close" onClick={() => setModalVisible(false)}>&times;</span>
            <h2>Add Report</h2>

            <form className="form-grid">
              <div className="form-left">
                <input type="text" name="title" placeholder="Report Title" required />
                <textarea name="description" placeholder="Describe the issue..." required></textarea>

                <label htmlFor="imageUpload">Upload Image</label>
                <div className="upload-wrapper">
                  <input type="file" id="imageUpload" name="image" accept="image/*" />
                  <div id="imagePreview" className="image-preview">
                    <a href="#" id="imageLink" target="_blank"></a>
                    <button type="button" id="removeImage" className="remove-btn">✖</button>
                  </div>
                </div>
              </div>

              <div className="form-right">
                <label htmlFor="address">Location</label>
                <input type="text" id="address" name="address" placeholder="Search or click on map" onChange={handleAddressChange} required />
                <input type="hidden" id="latitude" name="latitude" />
                <input type="hidden" id="longitude" name="longitude" />

                <div
                  id="modal-map"
                  ref={modalMapRef}
                  style={{ width: "100%", height: "18rem", margin: "10px 0", borderRadius: "6px" }}
                ></div>
              </div>
            </form>

            <button type="submit" form="reportForm">Submit Report</button>
          </div>
        </div>
      )}
    </>
  );
}
