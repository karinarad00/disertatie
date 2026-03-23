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
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const logoutAndRedirect = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0] || null);

  const handleUploadClick = async () => {
    if (!selectedFile) return;

    const userString = localStorage.getItem("user");
    if (!userString)
      return setError("Trebuie să fii autentificat pentru a încărca CV-ul.");

    const localUser = JSON.parse(userString);
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

  const handleCheckout = async (prodType) => {
    if (!user) return setError("Trebuie să fii autentificat pentru a cumpăra.");

    if (
      (prodType === "analiza_cv" && user.subscriptie_cv === 1) ||
      (prodType === "primeste_sugestii" && user.subscriptie_recomandari === 1)
    ) {
      navigate(prodType === "analiza_cv" ? "/analiza" : "/sugestii");
      return;
    }

    try {
      const userString = localStorage.getItem("user");
      if (!userString) return setError("Trebuie să fii autentificat.");
      const localUser = JSON.parse(userString);

      const res = await fetch(
        "http://localhost:5000/api/stripe/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localUser.token}`,
          },
          body: JSON.stringify({ userId: user.id, prodType }),
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

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (!userString) return setError("Nu ești autentificat.");

    let localUser;
    try {
      localUser = JSON.parse(userString);
    } catch {
      return setError("Datele utilizatorului sunt corupte.");
    }

    const token = localUser.token;
    if (!token)
      return setError("Token-ul lipsește. Te rugăm să te autentifici din nou.");

    fetch("http://localhost:5000/api/users/profil", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) return logoutAndRedirect();
        const contentType = res.headers.get("Content-Type");
        if (!res.ok) throw new Error(await res.text());
        if (!contentType || !contentType.includes("application/json"))
          throw new Error("Răspuns invalid de la server.");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
          setError("");
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setUser(null);
      });
  }, [navigate]);

  if (error)
    return (
      <div className="text-red-600 font-semibold text-center mt-4">{error}</div>
    );
  if (!user)
    return <div className="italic text-center mt-4">Se încarcă...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            {user.imagine_profil && (
              <img
                src={user.imagine_profil}
                alt="Imagine profil"
                className="w-40 h-40 object-cover rounded-full mx-auto mb-4"
              />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {user.username}
            </h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-gray-600">{user.role}</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 justify-center text-gray-700">
                <Mail className="size-5 text-gray-400" />{" "}
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 justify-center text-gray-700">
                <Phone className="size-5 text-gray-400" />{" "}
                <span className="text-sm">+40 123 456 789</span>
              </div>
            </div>

            {user.role === "Angajator" && (
              <button className="mt-6 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Promovează anunțurile firmei
              </button>
            )}
          </div>
        </div>

        {/* CV & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">CV / Resume</h2>
            </div>

            {/* Upload / Preview */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 bg-gray-50 flex justify-center items-center">
              {user.cv_url ? (
                <iframe
                  src={`http://localhost:5000/api/cv/preview_cv?cv_url=${encodeURIComponent(user.cv_url)}`}
                  title="Preview CV"
                  className="w-full h-[32rem] border rounded"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <FileText className="size-16 mb-3" />
                  <p>Nu ai încărcat CV-ul</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {user.role === "Candidat" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex flex-col items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
                  <Upload className="size-5 mb-1" />
                  {user.cv_url ? "Actualizează CV" : "Încarcă CV"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <button
                  onClick={() => handleCheckout("analiza_cv")}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition text-white ${
                    user.cv_url
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!user.cv_url}
                >
                  <TrendingUp className="size-5" /> Analizează CV
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
                  <Sparkles className="size-5" /> Sugestii Joburi
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
