import React, { useState, useEffect } from "react";

const AnalizaCv = () => {
  const [token, setToken] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Preluare date utilizator din localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setToken(parsed.token);
      setCvUrl(parsed.cv_url);
    }
  }, []);

  // 🔹 Verificare existență CV
  useEffect(() => {
    if (cvUrl) {
      setStatusMsg("CV încărcat cu succes. Apasă pe buton pentru analiză.");
    }
  }, [cvUrl]);

  // 🔹 Trimitere către backend pentru analiză
  const handleAnalyze = async () => {
    if (!cvUrl) {
      setError("Nu există un CV încărcat.");
      return;
    }

    setError("");
    setLoading(true);
    setRecommendations("");

    try {
      const res = await fetch("http://localhost:5000/api/cv/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cvUrl }), // backend va descărca și analiza PDF-ul
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Eroare la analiza CV-ului");
      }

      const data = await res.json();
      setRecommendations(
        data.recommendations || "Nu au fost găsite sugestii de îmbunătățire."
      );
    } catch (err) {
      console.error("Eroare frontend:", err);
      setError("A apărut o eroare la analiza CV-ului.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-md shadow mt-10">
      <h1 className="text-3xl font-bold mb-6">Analiză CV</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!cvUrl && <p className="mb-4">Nu ai încărcat încă un CV.</p>}

      {statusMsg && (
        <>
          <div className="p-4 border border-gray-200 rounded bg-gray-50 mb-4">
            <p className="text-gray-600">{statusMsg}</p>
          </div>

          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading
              ? "Se analizează..."
              : "Primește recomandări de îmbunătățire"}
          </button>
        </>
      )}

      {recommendations && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md text-gray-800">
          <h2 className="text-2xl font-semibold mb-2">
            Recomandări de îmbunătățire:
          </h2>
          <p className="whitespace-pre-line">{recommendations}</p>
        </div>
      )}
    </div>
  );
};

export default AnalizaCv;
