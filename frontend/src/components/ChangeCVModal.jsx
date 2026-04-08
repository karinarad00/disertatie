import React, { useState } from "react";
import { X, Upload } from "lucide-react";

export function ChangeCVModal({ isOpen, onClose, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
    setError("");
  };

  const handleUploadClick = async () => {
    if (!selectedFile) {
      setError("Te rog selectează un fișier.");
      return;
    }

    try {
      setUploading(true);
      if (onUpload) {
        await onUpload(selectedFile);
      }
      setSelectedFile(null);
      onClose();
    } catch (err) {
      setError("Eroare la încărcare: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
        >
          <X className="size-6" />
        </button>

        <h2 className="text-xl font-bold mb-4">Schimbă CV-ul</h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center bg-gray-50">
          {selectedFile ? (
            <div>
              <p className="text-gray-700 font-medium">{selectedFile.name}</p>
              <p className="text-gray-500 text-sm">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <p className="text-gray-500">
              Trage fișierul aici sau apasă pentru a selecta
            </p>
          )}
          <label className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
            <Upload className="size-5 mr-2" />
            Alege fișier
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <button
          onClick={handleUploadClick}
          disabled={uploading || !selectedFile}
          className={`w-full py-2 rounded-lg text-white font-semibold transition ${
            selectedFile
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {uploading ? "Se încarcă..." : "Încarcă CV"}
        </button>
      </div>
    </div>
  );
}
