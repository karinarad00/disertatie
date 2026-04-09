import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  TrendingUp,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Trash2,
} from "lucide-react";
import ImageWithFallback from "../components/ImageWithFallback";
import { ChangeCVModal } from "../components/ChangeCVModal";
import { EditProfileModal } from "../components/EditProfileModal";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [favoriteJobs, setFavoriteJobs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const logoutAndRedirect = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // Upload CV
  const handleFileChange = (e) => setSelectedFile(e.target.files[0] || null);
  const handleUploadClick = async () => {
    if (!selectedFile) return;

    const localUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!localUser.token) return setError("Trebuie să fii autentificat.");

    const formData = new FormData();
    formData.append("cv", selectedFile);

    try {
      setUploading(true);
      const res = await fetch("http://localhost:5000/api/cv/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${localUser.token}` },
        body: formData,
      });

      if (res.status === 401) return logoutAndRedirect();

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Eroare la încărcare.");

      setUser((prev) => {
        const updatedUser = { ...prev, cv_url: data.url };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      });

      setSelectedFile(null);
      setError("");
      alert("CV încărcat cu succes!");
    } catch (err) {
      setError("Eroare la încărcarea CV-ului: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Checkout products
  const handleCheckout = async (prodType) => {
    if (!user) return navigate("/login");

    if (
      (prodType === "analiza_cv" && user.subscriptie_cv === 1) ||
      (prodType === "primeste_sugestii" && user.subscriptie_recomandari === 1)
    ) {
      navigate(prodType === "analiza_cv" ? "/analiza" : "/sugestii");
      return;
    }

    try {
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");

      const res = await fetch(
        "http://localhost:5000/api/stripe/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localUser.token}`,
          },
          body: JSON.stringify({ userId: localUser.id, prodType }),
        },
      );

      if (res.status === 401) return logoutAndRedirect();

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la creare sesiune");

      window.location.href = data.url;
    } catch (err) {
      setError("Eroare la inițierea plății: " + err.message);
    }
  };

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!localUser.token) return setError("Trebuie să fii autentificat.");

      try {
        const res = await fetch("http://localhost:5000/api/users/profil", {
          headers: { Authorization: `Bearer ${localUser.token}` },
        });
        if (res.status === 401) return logoutAndRedirect();
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };
    fetchProfile();
  }, []);

  // Fetch favorite jobs
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user || user.role !== "Candidat") return;
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      try {
        const res = await fetch("http://localhost:5000/api/favorites/all", {
          headers: { Authorization: `Bearer ${localUser.token}` },
        });
        if (res.status === 401) return logoutAndRedirect();
        const jobs = await res.json();
        setFavoriteJobs(jobs);
      } catch (err) {
        console.error("Eroare la preluarea joburilor favorite:", err);
      }
    };
    fetchFavorites();
  }, [user]);

  const handleDeleteFavorite = async (jobId) => {
    const localUser = JSON.parse(localStorage.getItem("user") || "{}");
    try {
      const res = await fetch("http://localhost:5000/api/favorites/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localUser.token}`,
        },
        body: JSON.stringify({ ID_JOB: jobId }),
      });
      if (!res.ok) throw new Error("Eroare la ștergerea jobului favorite");
      setFavoriteJobs((prev) => prev.filter((j) => j.ID_JOB !== jobId));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (error)
    return (
      <div className="text-red-600 font-semibold text-center mt-4">{error}</div>
    );
  if (!user)
    return <div className="italic text-center mt-4">Se încarcă...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <ImageWithFallback
                src={user.imagine_profil || "https://via.placeholder.com/150"}
                alt="Imagine profil"
                className="w-40 h-40 object-cover rounded-full mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-gray-900">
                {user.username}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-gray-600">{user.role}</p>

              <div className="space-y-3 border-t mt-4 pt-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="size-5 text-gray-400" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="size-5 text-gray-400" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="size-5 text-gray-400" />
                    <span className="text-sm">{user.location}</span>
                  </div>
                )}
                {user.experience && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Briefcase className="size-5 text-gray-400" />
                    <span className="text-sm">
                      {user.experience} experience
                    </span>
                  </div>
                )}
              </div>

              <button
                className="w-full mt-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                onClick={() => setIsEditOpen(true)}
              >
                Editează Profil
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Profile Views</span>
                  <span className="font-semibold text-blue-600">
                    {user.views || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Applications</span>
                  <span className="font-semibold text-blue-600">
                    {user.applications || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Saved Jobs</span>
                  <span className="font-semibold text-blue-600">
                    {favoriteJobs.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CV & Favorites */}
          <div className="lg:col-span-2 space-y-6">
            {/* CV Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  My CV / Resume
                </h2>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 bg-gray-50 flex flex-col items-center justify-center">
                {user.cv_url ? (
                  <iframe
                    src={`http://localhost:5000/api/cv/preview_cv?cv_url=${encodeURIComponent(user.cv_url)}`}
                    title="Preview CV"
                    className="w-full h-[20rem] border rounded"
                  />
                ) : (
                  <>
                    <FileText className="size-16 text-gray-400 mb-4" />
                    <p className="text-gray-500">Nu ai încărcat CV-ul</p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <Upload className="size-5" />
                  {user.cv_url ? "Actualizează CV" : "Încarcă CV"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </button>

                <button
                  onClick={() => handleCheckout("analiza_cv")}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition text-white ${
                    user.cv_url
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!user.cv_url}
                >
                  <TrendingUp className="size-5" />
                  Analizează CV
                </button>

                <button
                  onClick={() => handleCheckout("primeste_sugestii")}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition text-white ${
                    user.cv_url
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!user.cv_url}
                >
                  <Sparkles className="size-5" />
                  Sugestii Joburi
                </button>
              </div>
            </div>

            {/* Favorite Jobs */}
            {favoriteJobs.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Joburi Salvate</h2>
                <div className="space-y-4">
                  {favoriteJobs.map((job) => (
                    <div
                      key={job.ID_JOB}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow flex items-start justify-between cursor-pointer"
                    >
                      <div
                        className="flex-1"
                        onClick={() => navigate(`/all/${job.ID_JOB}`)}
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {job.TITLU}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {job.DENUMIRE_COMPANIE && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="size-4" />
                              <span>{job.DENUMIRE_COMPANIE}</span>
                            </div>
                          )}
                          {job.LOCATIE && (
                            <div className="flex items-center gap-1">
                              <MapPin className="size-4" />
                              <span>{job.LOCATIE}</span>
                            </div>
                          )}
                          {job.DATA_POSTARII && (
                            <span>
                              Posted:{" "}
                              {new Date(job.DATA_POSTARII).toLocaleDateString(
                                "ro-RO",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          onClick={() => navigate(`/job/${job.ID_JOB}`)}
                        >
                          Vezi
                        </button>
                        <button
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                          onClick={() => handleDeleteFavorite(job.ID_JOB)}
                        >
                          <Trash2 className="size-4" /> Șterge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ChangeCVModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={user}
        onProfileUpdated={(updatedUser) => setUser(updatedUser)}
      />
    </div>
  );
}
