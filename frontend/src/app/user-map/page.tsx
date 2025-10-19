"use client";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./user-map.module.css";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface UserProfile {
  profilePicture?: {
    url?: string;
    public_id?: string;
  };
}

interface Report {
  _id: string;
  user?: {
    fName: string;
    lName: string;
    profilePicture?: {
      url?: string;
      public_id?: string;
    };
  };
  title: string;
  description: string;
  status: string;
  location: string;
  image?: string;
  latitude?: string | number;
  longitude?: string | number;
}

export default function UserMapPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const feedMapRef = useRef<L.Map | null>(null);
  const modalMapRef = useRef<L.Map | null>(null);
  const modalMarkerRef = useRef<L.Marker | null>(null);

  const defaultProfilePic = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

  const [reports, setReports] = useState<Report[]>([]);

  // Fetch current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/users/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          console.log("✅ User profile loaded:", data);
          console.log("📸 Profile picture URL:", data.profilePicture?.url);
          setUserProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };
    fetchUserProfile();
  }, [API]);

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${API}/reports`);
        if (res.ok) {
          const data = await res.json();
          console.log("✅ Reports loaded:", data);
          setReports(data);
        }
      } catch (err) {
        console.error("Failed to fetch reports", err);
      }
    };
    fetchReports();
  }, [API]);

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
        const m = L.marker([parseFloat(String(r.latitude)), parseFloat(String(r.longitude))], {
          icon: customPin,
        }).addTo(feedMap);
        
        const userName = r.user ? `${r.user.fName} ${r.user.lName}` : 'Anonymous';
        const userPic = r.user?.profilePicture?.url || defaultProfilePic;
        
        m.bindPopup(`
          <div style="text-align: center;">
            <img src="${userPic}" alt="${userName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-bottom: 8px;" />
            <br>
            <b>${r.title}</b><br>
            <b>Reported by:</b> ${userName}<br>
            <b>Status:</b> ${r.status}<br>
            <b>Location:</b> ${r.location}
          </div>
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setReportForm({ ...reportForm, image: file });
    }
  };

  const removeImage = () => {
    setUploadedFile(null);
    setReportForm({ ...reportForm, image: null });
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

      const res = await fetch(`${API}/reports`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Report submitted successfully!");
        setModalOpen(false);
        
        // Refresh reports after submission
        const refreshRes = await fetch(`${API}/reports`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setReports(data);
        }
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to submit report");
      }
    } catch (error) {
      toast.error("An error occurred while submitting the report.");
    }
  };

  const profilePicUrl = userProfile?.profilePicture?.url || defaultProfilePic;

  return (
    <>
      <Head>
        <title>FixIt PH - Community Reports</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          src="https://kit.fontawesome.com/830b39c5c0.js"
          crossOrigin="anonymous"
          defer
        ></script>
      </Head>

      <header className={styles.overlayNav}>
        <nav className={styles.nav}>
          <div className={styles.brand}>
            <Image
              src="/images/Fix-it_logo_3.png"
              alt="Fixit Logo"
              className={styles.logo}
              width={160}
              height={40}
            />
          </div>

          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <ul
            className={`${styles.navList} ${menuOpen ? styles.open : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <li>
              <a className={styles.navLink} href="/user-map">
                Map
              </a>
            </li>
            <li>
              <a className={styles.navLink} href="/user-feed">
                Feed
              </a>
            </li>
            <li>
              <a className={styles.navLink} href="/user-myreports">
                My Reports
              </a>
            </li>
            <li>
              <a className={styles.profileLink} href="/user-profile">
                <img
                  src={profilePicUrl}
                  alt="User Profile"
                  className={styles.profilePic}
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('Failed to load profile picture');
                    (e.target as HTMLImageElement).src = defaultProfilePic;
                  }}
                />
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className={styles.fullMapWrap}>
        <div id="map" className={styles.fullMap} aria-label="Community map"></div>

        <button
          className={styles.reportBtn}
          onClick={() => setModalOpen(true)}
          aria-label="Add report"
        >
          Add Report
        </button>
      </main>

      {modalOpen && (
        <div id="reportModal" className={styles.modal} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <button
              className={styles.close}
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className={styles.modalTitle}>Add Report</h2>

            <form className={styles.formGrid} onSubmit={handleReportSubmit}>
              <div className={styles.formLeft}>
                <input
                  className={styles.input}
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
                  className={styles.textarea}
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
                <label className={styles.inputLabel} htmlFor="imageUpload">
                  Upload Image
                </label>
                <div className={styles.uploadWrapper}>
                  <input
                    className={styles.fileInput}
                    type="file"
                    id="imageUpload"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {uploadedFile && (
                    <div id="imagePreview" className={styles.imagePreview}>
                      <a
                        href={URL.createObjectURL(uploadedFile)}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.previewLink}
                      >
                        {uploadedFile.name}
                      </a>
                      <button
                        type="button"
                        onClick={removeImage}
                        className={styles.removeBtn}
                        aria-label="Remove image"
                      >
                        ✖
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formRight}>
                <label className={styles.inputLabel} htmlFor="address">
                  Location
                </label>
                <input
                  className={styles.input}
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
                <div id="modal-map" className={styles.modalMap}></div>
              </div>

              <div className={styles.submitRow}>
                <button type="submit" className={styles.submitBtn}>
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
