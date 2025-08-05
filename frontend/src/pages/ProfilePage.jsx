import React, { useEffect, useState } from "react";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;

    const userString = localStorage.getItem("user");
    if (!userString) {
      setError("Trebuie să fii autentificat pentru a încărca CV-ul.");
      return;
    }

    const localUser = JSON.parse(userString);
    const formData = new FormData();
    formData.append("cv", selectedFile);

    try {
      setUploading(true);
      const res = await fetch("http://localhost:5000/api/users/upload-cv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localUser.token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Eroare la încărcare.");

      alert("CV încărcat cu succes!");
      // Actualizează userul cu date noi (eventual fă fetch din nou)
      setUser((prev) => ({ ...prev, cv_url: data.cv_url || true }));
      setSelectedFile(null);
      setError("");
    } catch (err) {
      setError("Eroare la încărcarea CV-ului: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (!userString) {
      setError("Nu ești autentificat.");
      return;
    }

    let localUser;
    try {
      localUser = JSON.parse(userString);
    } catch {
      setError("Datele utilizatorului sunt corupte.");
      return;
    }

    const token = localUser.token;
    if (!token) {
      setError("Token-ul lipsește. Te rugăm să te autentifici din nou.");
      return;
    }

    fetch("http://localhost:5000/api/users/profil", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const contentType = res.headers.get("Content-Type");
        if (!res.ok) throw new Error(await res.text());
        if (!contentType || !contentType.includes("application/json"))
          throw new Error("Răspuns invalid de la server.");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setError("");
      })
      .catch((err) => {
        console.error("Eroare la fetch:", err);
        setError(err.message);
        setUser(null);
      });
  }, []);

  if (error)
    return (
      <div className="text-red-600 font-semibold text-center mt-4">{error}</div>
    );

  if (!user)
    return <div className="italic text-center mt-4">Se încarcă...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
      <h1 className="text-2xl font-bold mb-4">Profilul utilizatorului</h1>
      <p className="mb-2">
        <span className="font-semibold">Nume utilizator:</span> {user.username}
      </p>
      <p className="mb-2">
        <span className="font-semibold">Email:</span> {user.email}
      </p>
      <p className="mb-4">
        <span className="font-semibold">Rol:</span> {user.role}
      </p>

      {user.imagine_profil && (
        <img
          src={user.imagine_profil}
          alt="Imagine profil"
          className="w-40 h-40 object-cover rounded-lg mb-4"
        />
      )}

      {user.role === "Candidat" && (
        <div className="space-y-4">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="block"
          />

          <button
            className={`px-4 py-2 rounded text-white ${
              selectedFile
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            } transition`}
            disabled={!selectedFile || uploading}
            onClick={handleUploadClick}
          >
            {user.cv_url ? "Actualizează CV" : "Încarcă CV"}
          </button>

          {user.cv_url && (
            <div>
              <p>
                <a
                  href={user.cv_url}
                  download
                  className="text-blue-600 underline"
                >
                  Descarcă CV
                </a>
              </p>
              <embed
                src={user.cv_url}
                type="application/pdf"
                width="100%"
                height="600px"
                style={{ border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
          )}

          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
            Analizează CV <span className="ml-1">€</span>
          </button>
        </div>
      )}

      {user.role === "Angajator" && (
        <div>
          <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
            Promovează anunțurile firmei
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
