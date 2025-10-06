"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "./user-myreports.css";
import "./user-myreports.css"; // modal/form/map styles reused
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

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
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

  // Leaflet refs for edit modal
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

  // Dynamically import Leaflet only on client
  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined") {
        const leafletModule = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        setLRef(leafletModule.default || leafletModule);
      }
    })();
  }, []);

  // Initialize map when edit modal opens
  useEffect(() => {
    if (editModalVisible && editMapRef.current && !editMap && LRef) {
      const L = LRef;
      const map = L.map(editMapRef.current).setView([14.8292, 120.2828], 13);
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

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;

        if (editMarker) {
          editMarker.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { icon: customPin }).addTo(map);
          setEditMarker(marker);
        }

        // update form fields
        const address = await getAddressFromCoords(lat, lng);
        setEditForm((prev) => ({
          ...prev,
          location: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          latitude: lat,
          longitude: lng,
        }));
      });
    }
    // cleanup when modal closes: remove map & marker
    return () => {
      if (!editModalVisible && editMap) {
        try {
          editMap.remove();
        } catch (e) {
          // ignore
        }
        setEditMap(null);
        setEditMarker(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editModalVisible, LRef]);

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

  const handleDelete = async (reportId: string, index: number) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

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

  // Open edit modal and prefill form
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

    // set marker when map initializes (use effect will place marker if map exists)
    // We try to set marker if LRef & editMap exist already:
    setTimeout(() => {
      if (LRef && editMapRef.current) {
        // try to center map and place marker once editMap is ready
        tryPlaceMarker(report);
      }
    }, 250);
  };

  const tryPlaceMarker = (report: Report) => {
    if (!LRef) return;
    // if editMap is already created, place marker immediately
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

  // Handle file select in edit modal
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
    // if there was a preview from server, we mark removeImage true so backend can remove it
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
    // indicate removal to backend if requested
    if (editForm.removeImage) {
      formData.append("removeImage", "true");
    }

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${editForm._id}`, {
        method: "PATCH", // frontend uses PATCH; backend can also accept PUT if they prefer
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (res.ok) {
        const updatedReport = await res.json();
        setReports((prev) => prev.map((r) => (r._id === updatedReport._id ? updatedReport : r)));
        toast.success("Report updated successfully!");
        setEditModalVisible(false);

        // cleanup created object URLs
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

  return (
    <div>
      {/* HEADER */}
      <header>
        <nav>
          <Image src="/images/Fix-it_logo_3.png" alt="Fixit Logo" className="logo" width={160} height={40} />
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <ul className={`nav-list-user-side ${menuOpen ? "open" : ""}`}>
            <li><Link href="/user-map">Map</Link></li>
            <li><Link href="/user-feed">Feed</Link></li>
            <li><Link href="/user-myreports">My Reports</Link></li>
            <li>
              <Link href="/user-profile" className="profile-link">
                <Image src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="User Profile" className="profile-pic" width={40} height={40} />
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* MY REPORTS */}
      <div id="user-myreports">
        <div className="myreports-container">
          <div className="myreports-column-1">
            <div className="myreports-search">
              <input type="text" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div id="reportList">
              {filteredReports.length > 0 ? (
                filteredReports.map((report, i) => (
                  <div key={report._id || i} className="report-card">
                    <div className="report-row">
                      <div>
                        <div className="report-header">
                          <Image src="/images/sample_avatar.png" alt="Avatar" className="report-avatar" width={32} height={32} />
                          <span className="report-user">{report.user.fName} {report.user.lName}</span>
                        </div>

                        <h3 className="report-title">{report.title}</h3>
                        <p className="report-location"><i className="fa-solid fa-location-dot"></i> {report.location}</p>
                        <span className={`report-status ${String(report.status).toLowerCase().replace(" ", "-")}`}>{report.status}</span>

                        <p className="report-details">{report.description}</p>
                      </div>

                      <div className="report-image">
                        <div style={{ marginTop: "10px", marginLeft: "24rem", marginBottom: "2rem"}}>
                          <button
                            className="edit-btn"
                            onClick={() => handleEditClick(report)}
                            style={{
                              backgroundColor: "#007bff",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              marginRight: "10px",
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(report._id, i)}
                            style={{
                              backgroundColor: "#ff4444",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        <Image src={report.image || "/images/broken-streetlights.jpg"} alt="Report Image" width={500} height={250} />
                      </div>
                    </div>

                    <div className="report-comments">
                      <h4>Comments</h4>
                      <ul className="comment-list">
                        {(report.comments ?? []).map((c, j) => (
                          <li key={j}><b>{c.author}:</b> {c.text}</li>
                        ))}
                      </ul>
                      <input type="text" className="comment-input" placeholder="Add a comment..." onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleComment(i, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }} />
                    </div>
                  </div>
                ))
              ) : (
                <p id="noResults" style={{ color: "red", marginTop: "10px" }}>No reports found</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editModalVisible && (
        <div className="modal" style={{ display: "flex" }}>
          <div className="modal-content" role="dialog" aria-modal="true" style={{ width: "90%", maxWidth: 900 }}>
            <span className="close" onClick={() => setEditModalVisible(false)}>&times;</span>
            <h2>Edit Report</h2>

            <form className="form-grid" onSubmit={handleEditSubmit}>
              <div className="form-left">
                <input type="text" name="title" placeholder="Report Title" value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />

                <textarea name="description" placeholder="Describe the issue..." value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />

                <label htmlFor="editImageUpload">Upload Image</label>
                <div className="upload-wrapper">
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

                  <div id="imagePreview" className="image-preview" style={{ position: "relative" }}>
                    {editForm.imagePreview ? (
                      <>
                        <img src={editForm.imagePreview} alt="preview" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 4 }} />
                        <button type="button" onClick={handleRemoveImage} className="remove-btn" style={{
                          position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer"
                        }}>✖</button>
                      </>
                    ) : (
                      <div style={{ width: "100%", height: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "#f2f2f2", borderRadius: 4 }}>
                        <span style={{ color: "#666" }}>No image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-right">
                <label htmlFor="editAddress">Location</label>
                <input type="text" id="editAddress" name="address" placeholder="Search or click on map"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />

                <input type="hidden" id="editLatitude" name="latitude" value={String(editForm.latitude ?? "")} />
                <input type="hidden" id="editLongitude" name="longitude" value={String(editForm.longitude ?? "")} />

                <div
                  id="edit-modal-map"
                  ref={editMapRef}
                  style={{ width: "100%", height: "18rem", margin: "10px 0", borderRadius: 6 }}
                />
              </div>

              <button type="submit" className="submit-btn">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
