"use client";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../fixit-css.css";

export default function UserMapPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [profilePic] = useState(
    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
  );

  const feedMapRef = useRef<L.Map | null>(null);
  const modalMapRef = useRef<L.Map | null>(null);
  const modalMarkerRef = useRef<L.Marker | null>(null);

  // Custom pin icon
  const customPin = L.icon({
    iconUrl: "/images/pin.png", // your custom pin
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "/images/marker-shadow.png", // optional shadow, can remove if not used
    shadowSize: [41, 41],
  });

  // Initialize Feed Map
  useEffect(() => {
    if (feedMapRef.current) return;

    const feedMap = L.map("map").setView([14.8292, 120.2828], 13);
    feedMapRef.current = feedMap;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(feedMap);

    const reports = [
      {
        lat: 14.8295,
        lng: 120.282,
        title: "Broken streetlight",
        status: "Pending",
        address: "Magsaysay Drive, Olongapo City",
      },
      {
        lat: 14.827,
        lng: 120.2845,
        title: "Garbage not collected",
        status: "In Progress",
        address: "Rizal Avenue, Olongapo City",
      },
    ];

    reports.forEach((r) => {
      const m = L.marker([r.lat, r.lng], { icon: customPin }).addTo(feedMap);
      m.bindPopup(`
        <b>${r.title}</b><br>
        <b>Status:</b> ${r.status}<br>
        <b>Location:</b> ${r.address}
      `);
    });
  }, []);

  // Initialize Modal Map
  useEffect(() => {
    if (!modalOpen || modalMapRef.current) return;

    const modalMap = L.map("modal-map").setView([14.8292, 120.2828], 13);
    modalMapRef.current = modalMap;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(modalMap);

    modalMap.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (modalMarkerRef.current) {
        modalMarkerRef.current.setLatLng([lat, lng]);
      } else {
        modalMarkerRef.current = L.marker([lat, lng], { icon: customPin }).addTo(modalMap);
      }

      (document.getElementById("latitude") as HTMLInputElement).value = lat.toString();
      (document.getElementById("longitude") as HTMLInputElement).value = lng.toString();

      const address = await getAddressFromCoords(lat, lng);
      (document.getElementById("address") as HTMLInputElement).value =
        address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    });

    setTimeout(() => modalMap.invalidateSize(), 200);
  }, [modalOpen]);

  async function getAddressFromCoords(lat: number, lng: number): Promise<string | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      return data.display_name;
    } catch {
      return null;
    }
  }

  async function getCoordsFromAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await res.json();
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      return null;
    } catch {
      return null;
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const removeImage = () => {
    setUploadedFile(null);
  };

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    const coords = await getCoordsFromAddress(address);
    if (coords && modalMapRef.current) {
      if (modalMarkerRef.current) {
        modalMarkerRef.current.setLatLng([coords.lat, coords.lng]);
      } else {
        modalMarkerRef.current = L.marker([coords.lat, coords.lng], { icon: customPin }).addTo(modalMapRef.current);
      }
      modalMapRef.current.setView([coords.lat, coords.lng], 16);

      (document.getElementById("latitude") as HTMLInputElement).value = coords.lat.toString();
      (document.getElementById("longitude") as HTMLInputElement).value = coords.lng.toString();
    }
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
        <nav>
          <img src="/images/Fix t_5.png" className="logo" />
          <ul className="nav-list-user-side">
            <li><a href="/user-map">Map</a></li>
            <li><a href="/user-feed">Feed</a></li>
            <li><a href="/user-myreports">My Reports</a></li>
            <li>
              <a href="/user-profile" className="profile-link">
                <img src={profilePic} alt="User Profile" className="profile-pic" />
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <div id="user-map">
        <div className="map-container">
          <div className="map-row-1">
            <button className="report-btn" onClick={() => setModalOpen(true)}>
              + Add Report
            </button>
          </div>
          <div className="map-row-2">
            <div
              id="map"
              style={{ width: "100%", height: "30rem", borderRadius: "1rem" }}
            ></div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div id="reportModal" className="modal" style={{ display: "flex" }}>
          <div className="modal-content">
            <span className="close" onClick={() => setModalOpen(false)}>
              &times;
            </span>
            <h2>Add Report</h2>

            <form id="reportForm" className="form-grid">
              <div className="form-left">
                <input type="text" name="title" placeholder="Report Title" required />
                <textarea name="description" placeholder="Describe the issue..." required></textarea>

                <label htmlFor="imageUpload">Upload Image</label>
                <div className="upload-wrapper">
                  <input
                    type="file"
                    id="imageUpload"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {uploadedFile && (
                    <div id="imagePreview" className="image-preview">
                      <a
                        href={URL.createObjectURL(uploadedFile)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {uploadedFile.name}
                      </a>
                      <button type="button" onClick={removeImage} className="remove-btn">
                        ✖
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-right">
                <label htmlFor="address">Location</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Search or click on map"
                  required
                  onChange={handleAddressChange}
                />

                <input type="hidden" id="latitude" name="latitude" />
                <input type="hidden" id="longitude" name="longitude" />

                <div
                  id="modal-map"
                  style={{
                    width: "100%",
                    height: "18rem",
                    margin: "10px 0",
                    borderRadius: "6px",
                  }}
                ></div>
              </div>
            </form>

            <button type="submit" form="reportForm">
              Submit Report
            </button>
          </div>
        </div>
      )}
    </>
  );
}
