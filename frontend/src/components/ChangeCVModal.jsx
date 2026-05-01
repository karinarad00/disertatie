import React, { useState } from "react";
import { Upload } from "lucide-react";
import { useDispatch } from "react-redux";
import { updateProfile } from "../redux/authSlice";
import axios from "../axiosClient";

export function ChangeCVModal({
  isOpen,
  onClose,
  user,
  setError,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const dispatch = useDispatch();

  if (!isOpen) return null;

  const handleFileChange = (e) => setSelectedFile(e.target.files[0] || null);

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    
    // We don't need to manually check token here anymore for the request, 
    // axios interceptor handles it, but we check if we HAVE a user just in case.
    if (!user) return setError("Trebuie să fii autentificat.");

    const formData = new FormData();
    formData.append("cv", selectedFile);

    try {
      setUploading(true);

      const res = await axios.post("/api/cv/upload", formData);

      dispatch(updateProfile({ cv_url: res.data.url }));

      setSelectedFile(null);
      setError("");
      alert("CV încărcat cu succes!");
      onClose();
    } catch (err) {
      console.error("CV upload error:", err);
      // axiosClient handles 401/403
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError("Eroare la încărcarea CV-ului: " + (err.response?.data?.message || err.message));
      }
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
