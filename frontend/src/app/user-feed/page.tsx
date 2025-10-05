"use client";

import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./user-feed.css";
import Image from "next/image";
import { toast } from "react-toastify";

interface Report {
  _id: string;
  user: { fName: string; lName: string; email: string };
  title: string;
  description: string;
  status: string;
  location: string;
  image: string;
  comments?: { user: string; text: string; createdAt?: string }[];
}

export default function UserFeedPage() {
  const modalMapRef = useRef<HTMLDivElement>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMarker, setModalMarker] = useState<L.Marker | null>(null);
  const [modalMap, setModalMap] = useState<L.Map | null>(null);

  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    image: null as File | null,
    address: "",
    latitude: "",
    longitude: "",
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false); // <-- NEW for hamburger

  const filteredReports = reports.filter((r) =>
    `${r.user} ${r.title} ${r.location} ${r.description}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const customPin = L.icon({
    iconUrl: "/images/pin.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

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
        setReportForm(prev => ({
          ...prev,
          address: addressInput.value,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));
      });
    }
  }, [modalVisible, modalMap, modalMarker]);

  useEffect(() => {
    const fetchReports = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`);
      if (res.ok) {
        const data = await res.json();
        console.log('Reports with images:', data); // Debug to see image URLs
        setReports(data);
      }
    };
    fetchReports();
  }, []);

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

  const toggleBookmark = (reportId: string) => {
    const btn = document.querySelector(`#bookmark-${reportId} i`);
    if (btn) {
      btn.classList.toggle("fa-regular");
      btn.classList.toggle("fa-solid");
    }
  };

  const addComment = async (reportId: string, text: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${reportId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
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

    const formData = new FormData();
    formData.append("title", reportForm.title);
    formData.append("description", reportForm.description);
    if (reportForm.image) formData.append("image", reportForm.image);
    formData.append("location", reportForm.address);
    formData.append("latitude", reportForm.latitude);
    formData.append("longitude", reportForm.longitude);

    const token = localStorage.getItem('token');

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      toast.success("Report submitted successfully!");
      setModalVisible(false);
    } else {
      toast.error("Failed to submit report");
    }
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
          <Image src="/images/Fix-it_logo_3.png" alt="Fixit Logo" className="logo" width={160} height={40} />
          
          {/* Hamburger Button */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>

          <ul className={`nav-list-user-side ${menuOpen ? "open" : ""}`}>
            <li><a href="/user-map">Map</a></li>
            <li><a href="/user-feed">Feed</a></li>
            <li><a href="/user-myreports">My Reports</a></li>
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
              <div className="feed-button-search">
                <button className="report-btn" onClick={() => setModalVisible(true)}>+ Add Report</button>
              </div>
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
                  <div className="report-card" key={r._id}>
                    <div className="report-row"> 
                    <div>
                    <div className="report-header">
                      <img src="/images/sample_avatar.png" className="report-avatar" alt="Avatar" />
                      <span className="report-user">{r.user.fName} {r.user.lName}</span>
                      <button id={`bookmark-${r._id}`} className="bookmark-btn" onClick={() => toggleBookmark(r._id)}>
                        <i className="fa-regular fa-bookmark"></i>
                      </button>
                    </div>

                    <h3 className="report-title">{r.title}</h3>
                    <p className="report-location"><i className="fa-solid fa-location-dot"></i> {r.location}</p>
                    <p className="report-details">{r.description}</p>
                    <span className={`report-status ${r.status.toLowerCase().replace(" ", "-")}`}>{r.status}</span>
                    </div>
                    <div className="report-image">
                      <Image 
                        src={r.image || "/images/broken-streetlights.jpg"} // Use actual image URL or fallback
                        alt="Report Image" 
                        width={450} 
                        height={250}
                        onError={(e) => {
                          // Fallback if Cloudinary image fails to load
                          e.currentTarget.src = "/images/broken-streetlights.jpg";
                        }}
                      />
                      <ReportImage src={r.image} alt="Report Image" />
                    </div>
                    </div>
                    <div className="report-comments">
                      <h4>Comments</h4>
                      <ul className="comment-list">
                        {(r.comments ?? []).map((c, idx) => (
                          <li key={idx}>
                            <b>{c.user}:</b> {c.text}
                            {c.createdAt && (
                              <span style={{ color: "#888", marginLeft: 8, fontSize: "0.9em" }}>
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Add a comment..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value.trim() !== "") {
                            addComment(r._id, e.currentTarget.value);
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
        </div>
      </div>

      {/* Modal */}
      {modalVisible && (
        <div className="modal" style={{ display: "flex" }}>
          <div className="modal-content">
            <span className="close" onClick={() => setModalVisible(false)}>&times;</span>
            <h2>Add Report</h2>

            <form className="form-grid" onSubmit={handleReportSubmit}>
              <div className="form-left">
                <input
                  type="text"
                  name="title"
                  placeholder="Report Title"
                  value={reportForm.title}
                  onChange={e => setReportForm({ ...reportForm, title: e.target.value })}
                />
                <textarea
                  name="description"
                  placeholder="Describe the issue..."
                  value={reportForm.description}
                  onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                />

                <label htmlFor="imageUpload">Upload Image</label>
                <div className="upload-wrapper">
                  <input
                    type="file"
                    id="imageUpload"
                    name="image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setReportForm({ ...reportForm, image: file });
                        
                        // Show local preview before upload
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const preview = document.getElementById('imagePreview') as HTMLElement;
                          if (preview && event.target?.result) {
                            preview.innerHTML = `
                              <img src="${event.target.result}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px;" />
                              <button type="button" onclick="this.parentElement.innerHTML=''" class="remove-btn">✖</button>
                            `;
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div id="imagePreview" className="image-preview">
                    <a href="#" id="imageLink" target="_blank"></a>
                    <button type="button" id="removeImage" className="remove-btn">✖</button>
                  </div>
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
                />
                <input type="hidden" id="latitude" name="latitude" />
                <input type="hidden" id="longitude" name="longitude" />

                <div
                  id="modal-map"
                  ref={modalMapRef}
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
