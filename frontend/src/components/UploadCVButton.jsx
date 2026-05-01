// UploadCVButton.jsx
import React, { useState } from "react";
import { Upload } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { updateProfile } from "../redux/authSlice";
import axios from "../axiosClient";

export function UploadCVButton({ logoutAndRedirect, setError }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    if (!user) return setError("Trebuie să fii autentificat.");

    const formData = new FormData();
    formData.append("cv", selectedFile);

    try {
      setUploading(true);

      const res = await axios.post("/api/cv/upload", formData);

      // ✅ Update Redux state
      dispatch(updateProfile({ cv_url: res.data.url }));

      setSelectedFile(null);
      setError("");
      alert("CV încărcat cu succes!");
    } catch (err) {
      console.error("CV upload error:", err);
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError("Eroare la încărcarea CV-ului: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
        <Upload className="size-5" />
        {user?.cv_url ? "Actualizează CV" : "Încarcă CV"}
        <input type="file" className="hidden" onChange={handleFileChange} />
      </label>

      {selectedFile && (
        <button
          onClick={handleUploadClick}
          disabled={uploading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          {uploading ? "Se încarcă..." : "Confirmă încărcarea"}
        </button>
      )}
    </div>
  );
}
