import React, { useState, useEffect } from "react";

const AnalizaPage = ({ userId }) => {
  const [cvUrl, setCvUrl] = useState("");
  const [cvText, setCvText] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Preiau URL-ul CV din backend
  useEffect(() => {
    const fetchCvUrl = async () => {
      try {
        const res = await fetch(`/api/users/${userId}/cv-url`);
        if (!res.ok) throw new Error("Nu am putut prelua CV-ul");
        const data = await res.json();
        setCvUrl(data.cvUrl);
      } catch (err) {
        setError("Eroare la preluarea CV-ului.");
      }
    };

    fetchCvUrl();
  }, [userId]);

  // Preiau textul CV din link (presupunem e text simplu)
  useEffect(() => {
    if (!cvUrl) return;

    const fetchCvText = async () => {
      try {
        const res = await fetch(cvUrl);
        if (!res.ok) throw new Error("Nu am putut citi fișierul CV");
        const text = await res.text();
        setCvText(text);
      } catch (err) {
        setError("Eroare la citirea CV-ului.");
      }
    };

    fetchCvText();
  }, [cvUrl]);

  const handleAnalyze = async () => {
    if (!cvText.trim()) {
      setError("CV-ul este gol.");
      return;
    }
    setError("");
    setLoading(true);
    setRecommendations("");

    try {
      const res = await fetch("/api/analyze-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText }),
      });

      if (!res.ok) throw new Error("Eroare la analiza CV-ului");
      const data = await res.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError("A apărut o eroare la analiza CV-ului.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-md shadow mt-10">
      <h1 className="text-3xl font-bold mb-6">Analiză și Recomandări CV</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!cvText && !error && <p className="mb-4">Se încarcă CV-ul tău...</p>}

      {cvText && (
        <>
          <textarea
            rows="10"
            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
          />
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? "Analizăm..." : "Primește recomandări"}
          </button>
        </>
      )}

      {recommendations && (
        <div className="mt-8 p-4 bg-gray-100 rounded-md whitespace-pre-line text-gray-800">
          <h2 className="text-2xl font-semibold mb-2">Recomandări:</h2>
          <p>{recommendations}</p>
        </div>
      )}
    </div>
  );
};

export default AnalizaPage;
