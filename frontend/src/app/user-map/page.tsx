"use client";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./user-map.css";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function UserMapPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [profilePic] = useState(
    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
  );
  const [menuOpen, setMenuOpen] = useState(false); // for hamburger menu

  const feedMapRef = useRef<L.Map | null>(null);
  const modalMapRef = useRef<L.Map | null>(null);
  const modalMarkerRef = useRef<L.Marker | null>(null);

  // Custom pin icon
  const customPin = L.icon({
    iconUrl: "/images/pin.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "/images/marker-shadow.png",
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
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(feedMap);
  }, []);

  useEffect(() => {
    const feedMap = feedMapRef.current;
    if (!feedMap) return;

    feedMap.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        feedMap.removeLayer(layer);
      }
    });

    reports.forEach((r) => {
      if (r.latitude && r.longitude) {
        const m = L.marker([parseFloat(r.latitude), parseFloat(r.longitude)], {
          icon: customPin,
        }).addTo(feedMap);
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
        modalMarkerRef.current = L.marker([lat, lng], {
          icon: customPin,
        }).addTo(modalMap);
      }

      (document.getElementById("latitude") as HTMLInputElement).value =
        lat.toString();
      (document.getElementById("longitude") as HTMLInputElement).value =
        lng.toString();

      const address = await getAddressFromCoords(lat, lng);
      (document.getElementById("address") as HTMLInputElement).value =
        address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      setReportForm((prev) => ({
        ...prev,
        address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
    });

    setTimeout(() => modalMap.invalidateSize(), 200);
  }, [modalOpen]);

  async function getAddressFromCoords(
    lat: number,
    lng: number
  ): Promise<string | null> {
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

  async function getCoordsFromAddress(
    address: string
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`
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

  const ReportImage = ({ src, alt }: { src: string; alt: string }) => {
      const [imgSrc, setImgSrc] = useState(src || "/images/broken-streetlights.jpg");
  
      return (
        <Image
          src={imgSrc}
          alt={alt}
          width={450}
          height={250}
          onError={() => setImgSrc("/images/broken-streetlights.jpg")}
        />
      );
    };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setReportForm({ ...reportForm, image: file }); // <-- Add this line
    }
  };

  const removeImage = () => {
    setUploadedFile(null);
    setReportForm({ ...reportForm, image: null }); // <-- Add this line
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", reportForm.title);
      formData.append("description", reportForm.description);
      if (reportForm.image) formData.append("image", reportForm.image);
      formData.append("location", reportForm.address);
      formData.append("latitude", reportForm.latitude);
      formData.append("longitude", reportForm.longitude);

      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Report submitted successfully!");
        setModalOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to submit report");
      }
    } catch (error) {
      toast.error("An error occurred while submitting the report.");
    }
  };

  return (
    <>
      <Head>
        <title>FixIt PH - Community Reports</title>
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
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            background:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(0,0,0,0))",
            zIndex: 1000,
          }}
        >
          <Image
            src="/images/Fix-it_logo_3.png"
            alt="Fixit Logo"
            className="logo"
            width={160}
            height={40}
          />

          {/* Hamburger button */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>

          <ul
            className={`nav-list-user-side ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <li>
              <a href="/user-map">Map</a>
            </li>
            <li>
              <a href="/user-feed">Feed</a>
            </li>
            <li>
              <a href="/user-myreports">My Reports</a>
            </li>
            <li>
              <a href="/user-profile" className="profile-link">
                <img
                  src={profilePic}
                  alt="User Profile"
                  className="profile-pic"
                />
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
              style={{ width: "100%", height: "40rem", borderRadius: "0rem" }}
            ></div>

            <button
              className="report-btn"
              onClick={() => setModalOpen(true)}
              style={{
                padding: "0.7rem 1rem",
                border: "none",
                borderRadius: "6px",
                fontSize: "1rem",
                cursor: "pointer",
                position: "absolute",
                bottom: "6rem",
                left: "2rem",
                zIndex: 1000,
                boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
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
                  onChange={(e) =>
                    setReportForm({ ...reportForm, title: e.target.value })
                  }
                  required
                />
                <textarea
                  name="description"
                  placeholder="Describe the issue..."
                  value={reportForm.description}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      description: e.target.value,
                    })
                  }
                  required
                />
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
                      <button
                        type="button"
                        onClick={removeImage}
                        className="remove-btn"
                      >
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
                  onChange={(e) =>
                    setReportForm({ ...reportForm, address: e.target.value })
                  }
                  required
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
              <button type="submit" className="submit-btn">
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
