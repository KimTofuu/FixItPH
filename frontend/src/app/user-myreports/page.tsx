"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./user-myreports.module.css";
import { toast } from "react-toastify";

interface Report {
  _id: string;
  user: {
    fName: string;
    lName: string;
  };
  title: string;
  location?: string;
  description?: string;
  status: "Pending" | "In Progress" | string;
  image?: string | null;
  latitude?: string | number;
  longitude?: string | number;
  comments?: { author: string; text: string }[];
}

export default function UserMyReportsPage() {
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; index: number } | null>(null);

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
  });

  const editMapRef = useRef<HTMLDivElement | null>(null);
  const [LRef, setLRef] = useState<any>(null);
  const [editMap, setEditMap] = useState<any>(null);
  const [editMarker, setEditMarker] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/my`, {
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
  }, []);

  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined") {
        const leafletModule = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        setLRef(leafletModule.default || leafletModule);
      }
    })();
  }, []);

  // Initialize and handle Edit Report modal map
  useEffect(() => {
    if (!LRef) return;

    // When modal opens
    if (editModalVisible && editMapRef.current) {
      const L = LRef;

      // Clean up any existing map in container to prevent "already initialized" issues
      if (editMapRef.current.innerHTML !== "") {
        editMapRef.current.innerHTML = "";
      }

      // Default to report’s coordinates, or Olongapo City if missing
      const lat = Number(editForm.latitude) || 14.8292;
      const lng = Number(editForm.longitude) || 120.2828;

      // Initialize map
      const map = L.map(editMapRef.current).setView([lat, lng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      setEditMap(map);

      // Create the pin icon
      const customPin = L.icon({
        iconUrl: "/images/pin.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      // Place the existing marker (the one from the report)
      let marker = L.marker([lat, lng], { icon: customPin }).addTo(map);
      setEditMarker(marker);

      // On map click: move marker and update form
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;

        // Move the existing marker instead of creating a new one
        marker.setLatLng([lat, lng]);

        // Reverse geocode for address
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

  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      return data.display_name;
    } catch (err) {
      return null;
    }
  };

  const handleComment = (index: number, comment: string) => {
    if (!comment.trim()) return;
    const updatedReports = [...reports];
    updatedReports[index].comments = updatedReports[index].comments || [];
    updatedReports[index].comments.push({ author: "You", text: comment });
    setReports(updatedReports);
  };

  // NOTE: original handleDelete performs server call.
  // We will route delete through a confirmation modal: clicking "Delete" sets deleteTarget and opens confirm modal.
  const handleDelete = async (reportId: string, index: number) => {
  // Confirmation is handled by the confirmation modal; this function only performs deletion.
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${editForm._id}`, {
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

  // Open delete confirmation modal (does not perform deletion yet)
  const confirmDelete = (id: string, index: number) => {
    setDeleteTarget({ id, index });
    setDeleteModalVisible(true);
  };

  // Called when user confirms in the confirm modal
  const performDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    // call existing handleDelete
    await handleDelete(deleteTarget.id, deleteTarget.index);
    setDeleteTarget(null);
    setDeleteModalVisible(false);
  };

  return (
    <div className={styles.pageWrap}>
      {/* HEADER (nav + toolbar) */}
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
                <Image src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="User Profile" className={styles.profilePic} width={38} height={38} />
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.toolbar} role="toolbar" aria-label="Reports toolbar">
          <div className={styles.toolbarInner}>
            <button
              className={`${styles.reportBtn}`}
              onClick={() => setEditModalVisible(true)}
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
      </header>

      {/* MY REPORTS */}
      <main className={styles.feedContainer}>
        <section className={styles.feedList} id="user-myreports">
          <div className={styles.myreportsColumn}>

            <div id="reportList" className={styles.reportList}>
              {filteredReports.length > 0 ? (
                filteredReports.map((report, i) => (
                  <article key={report._id || i} className={styles.reportCard}>
                    <div className={styles.reportRow}>
                      <div className={styles.reportContent}>
                        <div className={styles.reportHeader}>
                          <Image src="/images/sample_avatar.png" alt="Avatar" className={styles.reportAvatar} width={32} height={32} />
                          <span className={styles.reportUser}>{report.user.fName} {report.user.lName}</span>
                        </div>

                        <h3 className={styles.reportTitle}>{report.title}</h3>
                        <p className={styles.reportLocation}><i className="fa-solid fa-location-dot"></i> {report.location}</p>
                        <span className={`${styles.reportStatus} ${String(report.status).toLowerCase().replace(" ", "-")}`}>{report.status}</span>

                        <p className={styles.reportDetails}>{report.description}</p>
                      </div>

                      <div className={styles.reportImage}>
                        <div className={styles.cardActions}>
                          <button className={styles.editBtn} onClick={() => handleEditClick(report)}>Edit</button>
                          <button className={styles.deleteBtn} onClick={() => confirmDelete(report._id, i)}>Delete</button>
                        </div>
                        <Image src={report.image || "/images/broken-streetlights.jpg"} alt="Report Image" width={500} height={250} />
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
                ))
              ) : (
                <p id="noResults" className={styles.noResults}>No reports found</p>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* EDIT MODAL styled like Add Report modal */}
      {editModalVisible && (
        <div className={styles.modal} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <button className={styles.close} onClick={() => setEditModalVisible(false)} aria-label="Close">×</button>
            <h2 className={styles.modalTitle}>Edit Report</h2>

            <form className={styles.formGrid} onSubmit={handleEditSubmit}>
              <div className={styles.formLeft}>
                <input type="text" name="title" placeholder="Report Title" value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />

                <textarea name="description" placeholder="Describe the issue..." value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />

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
                <input type="text" id="editAddress" name="address" placeholder="Search or click on map"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />

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

      {/* DELETE CONFIRMATION MODAL */}
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
