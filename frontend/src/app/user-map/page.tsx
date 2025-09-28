"use client";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../fixit-css.css";
import Image from "next/image";

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

  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    image: null as File | null,
    address: "",
    latitude: "",
    longitude: "",
  });

  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    if (feedMapRef.current) return;

    const feedMap = L.map("map").setView([14.8292, 120.2828], 13);
    feedMapRef.current = feedMap;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(feedMap);
  }, []);

  useEffect(() => {
    const feedMap = feedMapRef.current;
    if (!feedMap) return;

    // Remove existing markers (optional, for updates)
    feedMap.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        feedMap.removeLayer(layer);
      }
    });

    reports.forEach((r) => {
      if (r.latitude && r.longitude) {
        const m = L.marker([parseFloat(r.latitude), parseFloat(r.longitude)], { icon: customPin }).addTo(feedMap);
        m.bindPopup(`
          <b>${r.title}</b><br>
          <b>Status:</b> ${r.status}<br>
          <b>Location:</b> ${r.location}
        `);
      }
    });
  }, [reports, customPin]);
  
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

      // Update React state so the form submits correct values!
      setReportForm(prev => ({
        ...prev,
        address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
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

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", reportForm.title);
    formData.append("description", reportForm.description);
    if (reportForm.image) formData.append("image", reportForm.image);
    formData.append("location", reportForm.address);
    formData.append("latitude", reportForm.latitude);
    formData.append("longitude", reportForm.longitude);

    // Get the JWT token from localStorage
    const token = localStorage.getItem('token');

    // Send the report with the Authorization header
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      // Optionally refresh the reports list
      setModalOpen(false);
    } else {
      alert("Failed to submit report");
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
        <nav
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0))",
            zIndex: 1000,
          }}
        >
          <Image src="/images/Fix-it_logo_2.png" alt="Fixit Logo" className="logo" width={160} height={40} />
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
          <div className="map-row-2" style={{ position: "relative" }}>
            <div
              id="map"
              style={{ width: "100%", height: "42rem", borderRadius: "0rem" }}
            ></div>

          <button
            className="report-btn"
            onClick={() => setModalOpen(true)}
            style={{
              padding: "0.7rem 1rem",
              background: "#ffffff",
              border: "none",
              borderRadius: "6px",
              color:"#1c1c1c",
              fontSize: "1rem",
              cursor: "pointer",
              position: "absolute",
              bottom: "6rem",
              left: "2rem",
              zIndex: 1000,
              boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",
              display: "flex",          // make content horizontal
              alignItems: "center",     // vertical centering
              gap: "0.5rem", 
            }}
          >
            <img
              src="/images/add-report.png" // put your image inside /public/icons/add.png
              alt="Add"
              style={{ width: "2rem", height: "2rem" }}
            />
              Add Report
            </button>
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

            <form className="form-grid" onSubmit={handleReportSubmit}>
              <div className="form-left">
                <input
                  type="text"
                  name="title"
                  placeholder="Report Title"
                  value={reportForm.title}
                  onChange={e => setReportForm({ ...reportForm, title: e.target.value })}
                  required
                />
                <textarea
                  name="description"
                  placeholder="Describe the issue..."
                  value={reportForm.description}
                  onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                  required
                />
                <label htmlFor="imageUpload">Upload Image</label>
                <div className="upload-wrapper">
                  <input
                    type="file"
                    id="imageUpload"
                    name="image"
                    accept="image/*"
                    onChange={e => setReportForm({ ...reportForm, image: e.target.files?.[0] || null })}
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
                  value={reportForm.address}
                  onChange={e => setReportForm({ ...reportForm, address: e.target.value })}
                  required
                />
                <input type="hidden" id="latitude" name="latitude" />
                <input type="hidden" id="longitude" name="longitude" />
                <div
                  id="modal-map"
                  style={{ width: "100%", height: "18rem", margin: "10px 0", borderRadius: "6px" }}
                ></div>
              </div>
              <button type="submit" className="submit-btn">Submit Report</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
