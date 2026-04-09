import React, { useState } from "react";
import { Upload } from "lucide-react";

export function ChangeCVModal({
  isOpen,
  onClose,
  user,
  setUser,
  logoutAndRedirect,
  setError,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

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
      onClose(); // close modal after upload
    } catch (err) {
      setError("Eroare la încărcarea CV-ului: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-96 p-6 space-y-6 transform transition-all scale-95 animate-scaleIn">
        <h3 className="text-2xl font-bold text-gray-900 text-center">
          Încarcă / Actualizează CV
        </h3>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-500 transition-colors">
          <Upload className="size-8 text-gray-400 mb-2" />
          <span className="text-gray-500 text-center">
            {selectedFile
              ? selectedFile.name
              : "Trage CV-ul aici sau selectează fișierul"}
          </span>
          <input type="file" onChange={handleFileChange} className="hidden" />
        </label>

        {selectedFile && (
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-colors ${
              uploading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {uploading ? "Se încarcă..." : "Confirmă"}
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full px-4 py-3 mt-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors font-medium"
        >
          Închide
        </button>
      </div>
    </div>
  );
}
