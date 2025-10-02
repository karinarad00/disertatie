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

  // 🔹 Declanșează analiza automat dacă există CV
  useEffect(() => {
    if (cvUrl) {
      setStatusMsg("CV încărcat. Analiza începe automat...");
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvUrl]);

  // 🔹 Funcție analiză
  const handleAnalyze = async () => {
    if (!cvUrl) return;

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
        body: JSON.stringify({ cvUrl }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Eroare la analiza CV-ului");
      }

      const data = await res.json();
      setRecommendations(
        data.recommendations || "Nu au fost găsite sugestii de îmbunătățire."
      );
      setStatusMsg("Analiza finalizată!");
    } catch (err) {
      console.error("Eroare frontend:", err);
      setError("A apărut o eroare la analiza CV-ului.");
      setStatusMsg("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-md shadow mt-10 relative">
      <h1 className="text-3xl font-bold mb-6">Analiză CV</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!cvUrl && <p className="mb-4">Nu ai încărcat încă un CV.</p>}

      {cvUrl && (
        <div className="mb-6 relative">
          {/* PDF Preview */}
          <iframe
            src={cvUrl}
            title="CV Preview"
            className="w-full h-96 border rounded"
          ></iframe>

          {/* Overlay during analysis */}
          {loading && (
            <div className="absolute top-0 left-0 w-full h-96 bg-black bg-opacity-30 flex items-center justify-center rounded">
              <span className="text-white text-lg font-semibold">
                Analiza CV-ului în curs...
              </span>
            </div>
          )}
        </div>
      )}

      {statusMsg && (
        <div className="p-4 border border-gray-200 rounded bg-gray-50 mb-4">
          <p className="text-gray-600">{statusMsg}</p>
        </div>
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
