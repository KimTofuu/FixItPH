"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./user-myreports.module.css";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface Report {
  _id: string;
  user: {
    fName: string;
    lName: string;
    profilePicture?: {
      url?: string;
      public_id?: string;
    };
  };
  title: string;
  location?: string;
  description?: string;
  status: "Pending" | "In Progress" | string;
  image?: string | null;
  latitude?: string | number;
  longitude?: string | number;
  comments?: { author: string; text: string }[];
  priority?: "urgent" | "not urgent" | string;
  category?: string;
}

interface UserProfile {
  fName?: string;
  lName?: string;
  email?: string;
  barangay?: string;
  municipality?: string;
  contact?: string;
  profilePicture?: {
    url?: string;
    public_id?: string;
  };
}

export default function UserMyReportsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileBanner, setShowProfileBanner] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; index: number } | null>(null);

  // Add Report modal state (from user-map)
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    category: "",
    isUrgent: false,
    image: null as File | null,
    address: "",
    latitude: "",
    longitude: "",
  });
  const addModalMapRef = useRef<any | null>(null);
  const addModalMarkerRef = useRef<any | null>(null);

  const [editForm, setEditForm] = useState({
    _id: "",
    title: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    imageFile: null as File | null,
    imagePreview: "" as string,
    removeImage: false,
    priority: "not urgent",
    category: "",
  });

  const editMapRef = useRef<HTMLDivElement | null>(null);
  const [LRef, setLRef] = useState<any>(null);
  const [editMap, setEditMap] = useState<any>(null);
  const [editMarker, setEditMarker] = useState<any>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const defaultProfilePic = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const profilePicUrl = userProfile?.profilePicture?.url || defaultProfilePic;

  const normalizeStatus = (s?: string): Report["status"] => {
    if (!s) return "Reported";
    const lower = s.toLowerCase();
    if (lower.includes("pend")) return "Pending";
    if (lower.includes("report")) return "Reported";
    if (lower.includes("in-progress") || lower.includes("progress") || lower.includes("process")) return "Processing";
    if (lower.includes("resolved") || lower.includes("resolve")) return "Resolved";
    if (lower === "pending") return "Pending";
    if (lower === "reported") return "Reported";
    if (lower === "processing") return "Processing";
    if (lower === "resolved") return "Resolved";
    return s;
  };

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
          setUserProfile(data);

          // Check if profile is incomplete
          const isIncomplete = !data.barangay || !data.municipality || !data.contact;
          setShowProfileBanner(isIncomplete);
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };
    fetchUserProfile();
  }, [API]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/reports/my`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const myReports = await res.json();
          setReports(myReports);
        } else {
          console.error("Failed to fetch my reports", await res.text());
        }
      } catch (err) {
        console.error("Failed to fetch my reports", err);
      }
    };
    fetchReports();
  }, [API]);

  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined") {
        const leafletModule = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        setLRef(leafletModule.default || leafletModule);
      }
    })();
  }, []);

  // Initialize map for Add Report modal when it opens
  useEffect(() => {
    if (!addModalVisible || !LRef) return;

    if (addModalMapRef.current) {
      try { addModalMapRef.current.remove(); } catch (e) {}
      addModalMapRef.current = null;
    }

    const L = LRef;
    const map = L.map("add-modal-map").setView([14.8292, 120.2828], 13);
    addModalMapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const customPin = L.icon({
      iconUrl: "/images/pin.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;
      if (addModalMarkerRef.current) {
        addModalMarkerRef.current.setLatLng([lat, lng]);
      } else {
        addModalMarkerRef.current = L.marker([lat, lng], { icon: customPin }).addTo(map);
      }

      (document.getElementById("add-latitude") as HTMLInputElement).value = lat.toString();
      (document.getElementById("add-longitude") as HTMLInputElement).value = lng.toString();

      const address = await getAddressFromCoords(lat, lng);
      (document.getElementById("add-address") as HTMLInputElement).value = address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      setReportForm((prev) => ({
        ...prev,
        address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
    });

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      try { map.remove(); } catch (e) {}
      addModalMapRef.current = null;
      addModalMarkerRef.current = null;
    };
  }, [addModalVisible, LRef]);

  const handleAddImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setReportForm({ ...reportForm, image: file });
    }
  };

  const removeAddImage = () => {
    setUploadedFile(null);
    setReportForm({ ...reportForm, image: null });
  };

  const handleAddReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.category) {
      toast.error("Please select a category.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", reportForm.title);
      formData.append("description", reportForm.description);
      formData.append("category", reportForm.category);
      formData.append("isUrgent", String(reportForm.isUrgent));
      if (reportForm.image) formData.append("image", reportForm.image);
      formData.append("location", reportForm.address);
      if (reportForm.latitude) formData.append("latitude", String(reportForm.latitude));
      if (reportForm.longitude) formData.append("longitude", String(reportForm.longitude));

      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/reports`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (res.ok) {
        const data = await res.json();
        const createdReport = data.report || data;
        toast.success("Report submitted successfully!");
        setReports((prev) => [createdReport, ...prev]);
        setReportForm({ title: "", description: "", category: "", isUrgent: false, image: null, address: "", latitude: "", longitude: "" });
        setUploadedFile(null);
        setAddModalVisible(false);
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to submit report");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit report");
    }
  };

  async function getAddressFromCoords(lat: number, lng: number): Promise<string | null> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      return data.display_name;
    } catch (err) {
      return null;
    }
  }

  useEffect(() => {
    if (!LRef) return;

    if (editModalVisible && editMapRef.current) {
      const L = LRef;

      if (editMapRef.current.innerHTML !== "") {
        editMapRef.current.innerHTML = "";
      }

      const lat = Number(editForm.latitude) || 14.8292;
      const lng = Number(editForm.longitude) || 120.2828;

      const map = L.map(editMapRef.current).setView([lat, lng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      setEditMap(map);

      const customPin = L.icon({
        iconUrl: "/images/pin.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      let marker = L.marker([lat, lng], { icon: customPin }).addTo(map);
      setEditMarker(marker);

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);

        const address = await getAddressFromCoords(lat, lng);
        setEditForm((prev) => ({
          ...prev,
          location: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          latitude: lat,
          longitude: lng,
        }));
      });

      setTimeout(() => map.invalidateSize(), 200);
    }

    if (!editModalVisible && editMap) {
      try {
        editMap.remove();
      } catch (e) {}
      setEditMap(null);
      setEditMarker(null);
    }
  }, [editModalVisible, LRef]);

  useEffect(() => {
    if (!editMap || !LRef) return;

    const lat = Number(editForm.latitude);
    const lng = Number(editForm.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const L = LRef;
    const customPin = L.icon({
      iconUrl: "/images/pin.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    editMap.setView([lat, lng], 14);

    if (editMarker) {
      try {
        editMarker.setLatLng([lat, lng]);
      } catch (e) {
        const marker = L.marker([lat, lng], { icon: customPin }).addTo(editMap);
        setEditMarker(marker);
      }
    } else {
      const marker = L.marker([lat, lng], { icon: customPin }).addTo(editMap);
      setEditMarker(marker);
    }
  }, [editForm.latitude, editForm.longitude, editMap, LRef]);

  

  const handleComment = (index: number, comment: string) => {
    if (!comment.trim()) return;
    const updatedReports = [...reports];
    updatedReports[index].comments = updatedReports[index].comments || [];
    updatedReports[index].comments.push({ author: "You", text: comment });
    setReports(updatedReports);
  };

  const handleDelete = async (reportId: string, index: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${reportId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (res.ok) {
        const updatedReports = reports.filter((_, i) => i !== index);
        setReports(updatedReports);
        toast.success("Report deleted successfully!");
      } else {
        toast.error("Failed to delete report");
      }
    } catch (err) {
      toast.error("Failed to delete report");
    }
  };

  const handleEditClick = (report: Report) => {
    setEditForm({
      _id: report._id,
      title: report.title || "",
      description: report.description || "",
      location: report.location || "",
      latitude: String(report.latitude ?? ""),
      longitude: String(report.longitude ?? ""),
      imageFile: null,
      imagePreview: (report.image as string) || "/images/broken-streetlights.jpg",
      removeImage: false,
      priority: (report.priority as string) || "not urgent",
      category: (report.category as string) || "",
    });

    setEditModalVisible(true);

    setTimeout(() => {
      if (LRef && editMapRef.current) {
        tryPlaceMarker(report);
      }
    }, 250);
  };

  const tryPlaceMarker = (report: Report) => {
    if (!LRef) return;

    if (editMap) {
      const L = LRef;
      const lat = Number(report.latitude) || 14.8292;
      const lng = Number(report.longitude) || 120.2828;
      editMap.setView([lat, lng], 14);
      const customPin = L.icon({
        iconUrl: "/images/pin.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });
      if (editMarker) {
        editMarker.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: customPin }).addTo(editMap);
        setEditMarker(marker);
      }
    }
  };

  const onEditImageChange = (file?: File | null) => {
    if (file) {
      setEditForm((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
        removeImage: false,
      }));
    }
  };

  const handleRemoveImage = () => {
    setEditForm((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: "",
      removeImage: true,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm._id) {
      toast.error("No report selected");
      return;
    }

    const formData = new FormData();
    formData.append("title", editForm.title);
    formData.append("description", editForm.description);
    formData.append("location", editForm.location);
    if (editForm.latitude) formData.append("latitude", String(editForm.latitude));
    if (editForm.longitude) formData.append("longitude", String(editForm.longitude));
    if (editForm.imageFile) {
      formData.append("image", editForm.imageFile);
    }

    if (editForm.removeImage) {
      formData.append("removeImage", "true");
    }

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API}/reports/${editForm._id}`, {
        method: "PATCH",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (res.ok) {
        const updatedReport = await res.json();
        setReports((prev) => prev.map((r) => (r._id === updatedReport._id ? updatedReport : r)));
        toast.success("Report updated successfully!");
        setEditModalVisible(false);

        if (editForm.imagePreview && editForm.imageFile) {
          URL.revokeObjectURL(editForm.imagePreview);
        }
      } else {
        const txt = await res.text();
        console.error("Update failed:", txt);
        toast.error("Failed to update report");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update report");
    }
  };

  const filteredReports = reports.filter((r) => {
    const text = `${r.user?.fName ?? ""} ${r.user?.lName ?? ""} ${r.title} ${r.location} ${r.description}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const confirmDelete = (id: string, index: number) => {
    setDeleteTarget({ id, index });
    setDeleteModalVisible(true);
  };

  const performDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    await handleDelete(deleteTarget.id, deleteTarget.index);
    setDeleteTarget(null);
    setDeleteModalVisible(false);
  };

  return (
    <div className={styles.pageWrap}>
      <header className={styles.headerWrap}>
        <nav className={styles.nav}>
          <div className={styles.brand}>
            <Image src="/images/Fix-it_logo_3.png" alt="Fixit Logo" className={styles.logo} width={160} height={40} />
          </div>

          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <ul className={`${styles.navList} ${menuOpen ? styles.open : ""}`}>
            <li><Link href="/user-map" className={styles.navLink}>Map</Link></li>
            <li><Link href="/user-feed" className={styles.navLink}>Feed</Link></li>
            <li><Link href="/user-myreports" className={styles.navLink}>My Reports</Link></li>
            <li>
              <Link href="/user-profile" className={styles.profileLink}>
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
                />
              </Link>
            </li>
          </ul>
        </nav>

        {/* Profile Completion Banner */}
        {showProfileBanner && (
          <div className={styles.profileBanner}>
            <div className={styles.bannerContent}>
              <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '10px', fontSize: '18px' }}></i>
              <span>
                Your profile is incomplete. Please update your barangay, municipality, and contact information.
              </span>
              <button 
                className={styles.bannerBtn}
                onClick={() => router.push('/user-profile')}
              >
                Complete Profile
              </button>
              <button 
                className={styles.bannerClose}
                onClick={() => setShowProfileBanner(false)}
                aria-label="Dismiss"
              >
                ✖
              </button>
            </div>
          </div>
        )}
      </header>

      <main className={styles.feedContainer}>
        <div className={styles.toolbar} role="toolbar" aria-label="Reports toolbar">
          <div className={styles.toolbarInner}>
            <button
              className={`${styles.reportBtn}`}
              onClick={() => setAddModalVisible(true)}
            >
              + Add Report
            </button>

            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <section className={styles.feedList} id="user-myreports">
          <div className={styles.myreportsColumn}>

            <div id="reportList" className={styles.reportList}>
              {filteredReports.length > 0 ? (
                filteredReports.map((report, i) => {
                  const reportUserPic = report.user?.profilePicture?.url || defaultProfilePic;
                  const statusClass = String(report.status || "").toLowerCase().replace(/\s+/g, "-");
                  
                  return (
                    <article key={report._id || i} className={styles.reportCard}>
                      <div className={styles.reportRow}>
                        <div className={styles.reportContent}>
                          <div className={styles.reportHeader}>
                            <img 
                              src={reportUserPic} 
                              alt="Avatar" 
                              className={styles.reportAvatar}
                              style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                            />
                            <span className={styles.reportUser}>{report.user.fName} {report.user.lName}</span>
                          </div>

                          <h3 className={styles.reportTitle}>{report.title}</h3>

                          <p className={styles.reportCategory}>
                            {report.category ?? "Uncategorized"}
                          </p>

                          <p className={styles.reportLocation}><i className="fa-solid fa-location-dot"></i> {report.location}</p>

                          <div className={styles.statusPriorityRow}>
                            <span className={`${styles.reportStatus} ${styles[statusClass] || ""}`}>
                              {report.status}
                            </span>
                          </div>

                          <p className={styles.reportDetails}>{report.description}</p>
                        </div>

                        <div className={styles.reportImage}>
                          <div className={styles.cardActions}>
                            <button className={styles.editBtn} onClick={() => handleEditClick(report)}>Edit</button>
                            <button className={styles.deleteBtn} onClick={() => confirmDelete(report._id, i)}>Delete</button>
                          </div>

                          {report.image ? (
                            <Image src={report.image} alt="Report Image" width={500} height={250} />
                          ) : (
                            <Image src="/images/broken-streetlights.jpg" alt="Report Image" width={500} height={250} />
                          )}
                        </div>
                      </div>

                      <div className={styles.reportComments}>
                        <h4>Comments</h4>
                        <ul className={styles.commentList}>
                          {(report.comments ?? []).map((c, j) => (
                            <li key={j}><b>{c.author}:</b> {c.text}</li>
                          ))}
                        </ul>
                        <input type="text" className={styles.commentInput} placeholder="Add a comment..." onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleComment(i, (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }} />
                      </div>
                    </article>
                  );
                })
              ) : (
                <p id="noResults" className={styles.noResults}>No reports found</p>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Edit Modal and Delete Modal remain the same */}
      {addModalVisible && (
        <div className={styles.modal} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <button className={styles.close} onClick={() => setAddModalVisible(false)} aria-label="Close">&times;</button>
            <h2 className={styles.modalTitle}>Add Report</h2>

            <form className={styles.formGrid} onSubmit={handleAddReportSubmit}>
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

                <label className={styles.inputLabel} htmlFor="addImageUpload">Upload Image</label>
                <div className={styles.uploadWrapper}>
                  <input
                    className={styles.fileInput}
                    type="file"
                    id="addImageUpload"
                    name="image"
                    accept="image/*"
                    onChange={handleAddImageChange}
                  />
                  {uploadedFile && (
                    <div id="imagePreview" className={styles.imagePreview}>
                      <a href={URL.createObjectURL(uploadedFile)} target="_blank" rel="noreferrer" className={styles.previewLink}>{uploadedFile.name}</a>
                      <button type="button" onClick={removeAddImage} className={styles.removeBtn} aria-label="Remove image">✖</button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formRight}>
                <label className={styles.inputLabel} htmlFor="add-address">Location</label>
                <input
                  className={styles.input}
                  type="text"
                  id="add-address"
                  name="address"
                  placeholder="Search or click on map"
                  value={reportForm.address}
                  onChange={(e) => setReportForm({ ...reportForm, address: e.target.value })}
                  required
                />
                <input type="hidden" id="add-latitude" name="latitude" />
                <input type="hidden" id="add-longitude" name="longitude" />
                <div id="add-modal-map" className={styles.modalMap}></div>

                <div className={styles.urgentToggle}>
                  <input
                    type="checkbox"
                    id="addIsUrgent"
                    name="isUrgent"
                    checked={reportForm.isUrgent}
                    onChange={(e) => setReportForm({ ...reportForm, isUrgent: e.target.checked })}
                  />
                  <label htmlFor="addIsUrgent">Mark as Urgent</label>
                </div>
              </div>

              <div className={styles.submitRow}>
                <button type="submit" className={styles.submitBtn}>Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editModalVisible && (
        <div className={styles.modal} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <button className={styles.close} onClick={() => setEditModalVisible(false)} aria-label="Close">×</button>
            <h2 className={styles.modalTitle}>Edit Report</h2>

            <form className={styles.formGrid} onSubmit={handleEditSubmit}>
              <div className={styles.formLeft}>
                <input 
                  className={styles.input}
                  type="text" 
                  name="title" 
                  placeholder="Report Title" 
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
                />

                <textarea 
                  className={styles.textarea}
                  name="description" 
                  placeholder="Describe the issue..." 
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
                />

                {/* Category dropdown added to edit modal (design only) */}
                <select
                  className={styles.input}
                  name="category"
                  value={(editForm as any).category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
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

                <label htmlFor="editImageUpload" className={styles.inputLabel}>Upload Image</label>
                <div className={styles.uploadWrapper}>
                  <input
                    type="file"
                    id="editImageUpload"
                    name="image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onEditImageChange(file);
                    }}
                  />

                  <div id="imagePreview" className={styles.imagePreview}>
                    {editForm.imagePreview ? (
                      <>
                        <img src={editForm.imagePreview} alt="preview" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 4 }} />
                        <button type="button" onClick={handleRemoveImage} className={styles.removeBtn} aria-label="Remove image">✖</button>
                      </>
                    ) : (
                      <div style={{ width: "100%", height: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "#f2f2f2", borderRadius: 4 }}>
                        <span style={{ color: "#666" }}>No image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formRight}>
                <label htmlFor="editAddress" className={styles.inputLabel}>Location</label>
                <input 
                  type="text" 
                  id="editAddress" 
                  name="address" 
                  placeholder="Search or click on map"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} 
                />

                <input type="hidden" id="editLatitude" name="latitude" value={String(editForm.latitude ?? "")} />
                <input type="hidden" id="editLongitude" name="longitude" value={String(editForm.longitude ?? "")} />

                <div id="edit-modal-map" ref={editMapRef} className={styles.modalMap} />
              </div>

              <div className={styles.submitRow}>
                <button type="submit" className={styles.submitBtn}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalVisible && (
        <div className={styles.modal} role="dialog" aria-modal="true">
          <div className={styles.confirmModal}>
            <h3 className={styles.confirmTitle}>Delete report</h3>
            <p className={styles.confirmText}>Are you sure you want to delete this report? This action cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => { setDeleteModalVisible(false); setDeleteTarget(null); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={performDeleteConfirmed}>Delete</button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}
