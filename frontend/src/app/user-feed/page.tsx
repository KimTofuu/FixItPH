"use client";

import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import styles from "./user-feed.module.css";
import Image from "next/image";
import { toast } from "react-toastify";
import { useLoader } from "@/context/LoaderContext";

interface Report {
  _id: string;
  user: { 
    fName: string; 
    lName: string; 
    email: string;
    profilePicture?: {
      url?: string;
      public_id?: string;
    };
  } | null;
  title: string;
  description: string;
  status: string;
  location: string;
  category: string; // Add category to interface
  isUrgent?: boolean; // Add isUrgent to interface
  image: string;
  comments?: { user: string; text: string; createdAt?: string }[];
}

interface UserProfile {
  profilePicture?: {
    url?: string;
    public_id?: string;
  };
}

export default function UserFeedPage() {
  const modalMapRef = useRef<HTMLDivElement>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMarker, setModalMarker] = useState<any>(null);
  const [modalMap, setModalMap] = useState<any>(null);
  const [LRef, setLRef] = useState<any>(null);

  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    category: "", // Add category to form state
    isUrgent: false, // Add isUrgent to form state
    image: null as File | null,
    address: "",
    latitude: "",
    longitude: "",
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { showLoader, hideLoader } = useLoader();

  const defaultProfilePic = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const filteredReports = reports.filter((r) =>
    `${r.user?.fName ?? ""} ${r.user?.lName ?? ""} ${r.title} ${r.location} ${r.description}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
          console.log("📸 Nav profile picture URL:", data.profilePicture?.url);
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
          console.log("📸 First report user pic:", data[0]?.user?.profilePicture?.url);
          setReports(data);
        }
      } catch (err) {
        console.error("Failed to load reports", err);
      }
    };
    fetchReports();
  }, [API]);

  // Dynamically import Leaflet only on client
  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined") {
        const leaflet = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        setLRef(leaflet);
      }
    })();
  }, []);

  // Initialize map when modal opens
  useEffect(() => {
    if (!modalVisible || !LRef) return;

    // Wait a bit for modal to render fully before attaching map
    setTimeout(() => {
      const mapContainer = document.getElementById("modal-map");
      if (!mapContainer) return;

      // Clear any previous map instance (important when reopening modal)
      if (mapContainer.innerHTML !== "") {
        mapContainer.innerHTML = "";
      }

      const L = LRef;
      const map = L.map(mapContainer).setView([14.8292, 120.2828], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const customPin = L.icon({
        iconUrl: "/images/pin.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      let marker: any = null;

      // Add marker on click, update its position if already added
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;

        if (marker) {
          marker.setLatLng([lat, lng]);
        } else {
          marker = L.marker([lat, lng], { icon: customPin }).addTo(map);
        }

        const addressInput = document.getElementById("address") as HTMLInputElement;
        const latInput = document.getElementById("latitude") as HTMLInputElement;
        const lngInput = document.getElementById("longitude") as HTMLInputElement;

        latInput.value = lat.toString();
        lngInput.value = lng.toString();

        const address = await getAddressFromCoords(lat, lng);
        addressInput.value = address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        setReportForm((prev) => ({
          ...prev,
          address: addressInput.value,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));
      });

      // Fix map resizing inside modal
      setTimeout(() => map.invalidateSize(), 200);
    }, 100);
  }, [modalVisible, LRef]);

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

  const toggleBookmark = (reportId: string) => {
    const btn = document.querySelector(`#bookmark-${reportId} i`);
    if (btn) {
      btn.classList.toggle("fa-regular");
      btn.classList.toggle("fa-solid");
    }
  };

  const addComment = async (reportId: string, text: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API}/reports/${reportId}/comment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      }
    );
    if (res.ok) {
      const updatedComments = await res.json();
      setReports((prev) =>
        prev.map((r) =>
          r._id === reportId ? { ...r, comments: updatedComments } : r
        )
      );
    }
  };

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

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportForm.category) {
      toast.error("Please select a category.");
      return;
    }

    showLoader(); // Show the loader

    try {
      const formData = new FormData();
      formData.append("title", reportForm.title);
      formData.append("description", reportForm.description);
      formData.append("category", reportForm.category); // Add category
      formData.append("isUrgent", String(reportForm.isUrgent)); // Add isUrgent
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
        setModalVisible(false);
        // Reset form
        setReportForm({
          title: "",
          description: "",
          category: "",
          isUrgent: false,
          image: null,
          address: "",
          latitude: "",
          longitude: "",
        });

        
        // Refresh reports after submission
        const refreshRes = await fetch(`${API}/reports`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setReports(data);
        }
      } else {
        toast.error("Failed to submit report");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred while submitting the report.");
    } finally {
      hideLoader(); // Hide the loader
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

      <header className={styles.headerWrap}>
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

          <ul className={`${styles.navList} ${menuOpen ? styles.open : ""}`}>
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
                  id="profilePic"
                  src={profilePicUrl}
                  alt="User Profile"
                  className={styles.profilePic}
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              </a>
            </li>
          </ul>
        </nav>

        <div className={styles.toolbar} role="toolbar" aria-label="Reports toolbar">
          <div className={styles.toolbarInner}>
            <button
              className={styles.reportBtn}
              onClick={() => setModalVisible(true)}
            >
              + Add Report
            </button>

            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className={styles.pageWrap}>
        <div className={styles.feedContainer}>
          <aside className={styles.feedSidebar}>
            {/* reserved space or additional widgets */}
          </aside>

          <section className={styles.feedMain}>
            <section id="reportList" className={styles.feedList}>
              {filteredReports.length > 0 ? (
                filteredReports.map((r) => {
                  const reportUserPic = r.user?.profilePicture?.url || defaultProfilePic;
                  console.log(`📸 Report ${r._id} user pic:`, reportUserPic);
                  
                  return (
                    <article className={styles.reportCard} key={r._id}>
                      <div className={styles.reportRow}>
                        <div>
                          <div className={styles.reportHeader}>
                            <img
                              src={reportUserPic}
                              className={styles.reportAvatar}
                              alt={r.user ? `${r.user.fName} ${r.user.lName}` : "User Avatar"}
                              style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                console.error('Failed to load image:', reportUserPic);
                                (e.target as HTMLImageElement).src = defaultProfilePic;
                              }}
                            />
                            <span className={styles.reportUser}>
                              {r.user ? `${r.user.fName} ${r.user.lName}` : "Unknown User"}
                            </span>
                            <button
                              id={`bookmark-${r._id}`}
                              className={styles.bookmarkBtn}
                              onClick={() => toggleBookmark(r._id)}
                            >
                              <i className="fa-regular fa-bookmark"></i>
                            </button>
                          </div>

                          <h3 className={styles.reportTitle}>{r.title}</h3>

                          <p className={styles.reportCategory}>
                            {r.category || "Uncategorized"}
                          </p>

                          <p className={styles.reportLocation}>
                            <i className="fa-solid fa-location-dot"></i> {r.location}
                          </p>
                          <span
                            className={`${styles.reportStatus} ${styles[r.status.toLowerCase().replace(" ", "-")]}`}
                          >
                            {r.status}
                          </span>
                          <p className={styles.reportDetails}>{r.description}</p>
                        </div>

                        <div className={styles.reportImage}>
                          <ReportImage src={r.image} alt="Report Image" />
                        </div>
                      </div>

                      <div className={styles.reportComments}>
                        <h4>Comments</h4>
                        <ul className={styles.commentList}>
                          {(r.comments ?? []).map((c, idx) => (
                            <li key={idx}>
                              <b>{c.user}:</b> {c.text}
                              {c.createdAt && (
                                <span className={styles.commentDate}>
                                  {new Date(c.createdAt).toLocaleString()}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <input
                          type="text"
                          className={styles.commentInput}
                          placeholder="Add a comment..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.currentTarget.value.trim() !== "") {
                              addComment(r._id, e.currentTarget.value);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className={styles.noReports}>No reports found</p>
              )}
            </section>
          </section>
        </div>
      </main>

      {/* Modal */}
      {modalVisible && (
        <div id="feedModal" className={styles.modal} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <button
              className={styles.close}
              onClick={() => setModalVisible(false)}
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
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  required
                />
                <textarea
                  className={styles.textarea}
                  name="description"
                  placeholder="Describe the issue..."
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  required
                />

                {/* Add Category Dropdown */}
                <select
                  className={styles.input}
                  name="category"
                  value={reportForm.category}
                  onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                  required
                >
                  <option value="" disabled>-- Select a Category --</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Sanitation and Waste">Sanitation and Waste</option>
                  <option value="Environment and Public Spaces">Environment and Public Spaces</option>
                  <option value="Community and Safety">Community and Safety</option>
                  <option value="Government / Administrative">Government / Administrative</option>
                  <option value="Others">Others</option>
                </select>

                <label className={styles.inputLabel} htmlFor="imageUpload">Upload Image</label>
                <div className={styles.uploadWrapper}>
                  <input
                    className={styles.fileInput}
                    type="file"
                    id="imageUpload"
                    name="image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setReportForm({ ...reportForm, image: file });
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const preview = document.getElementById("imagePreview") as HTMLElement;
                          if (preview && event.target?.result) {
                            preview.innerHTML = `
                              <img src="${event.target.result}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px;" />
                              <button type="button" onclick="this.parentElement.innerHTML=''" class="${styles.removeBtn}">✖</button>
                            `;
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div id="imagePreview" className={styles.imagePreview}>
                    <a href="#" id="imageLink" target="_blank" className={styles.previewLink}></a>
                    <button type="button" id="removeImage" className={styles.removeBtn}>✖</button>
                  </div>
                </div>
              </div>

              <div className={styles.formRight}>
                <label className={styles.inputLabel} htmlFor="address">Location</label>
                <input
                  className={styles.input}
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Search or click on map"
                  value={reportForm.address}
                  onChange={(e) => setReportForm({ ...reportForm, address: e.target.value })}
                  required
                />
                <input type="hidden" id="latitude" name="latitude" />
                <input type="hidden" id="longitude" name="longitude" />

                <div id="modal-map" ref={modalMapRef} className={styles.modalMap}></div>
             
                     {/* Add Urgent Checkbox */}
                <div className={styles.urgentToggle}>
                  <input
                    type="checkbox"
                    id="isUrgent"
                    name="isUrgent"
                    checked={reportForm.isUrgent}
                    onChange={(e) => setReportForm({ ...reportForm, isUrgent: e.target.checked })}
                  />
                  <label htmlFor="isUrgent">Mark as Urgent</label>
                </div>
               </div>
              <div className={styles.submitRow}>
                <button type="submit" className={styles.submitBtn}>Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
