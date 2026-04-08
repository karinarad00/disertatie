import React, { useState, useEffect } from "react";
import { FileText, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AnalizaCv = () => {
  const [token, setToken] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setToken(parsed.token);
      setCvUrl(parsed.cv_url);
    }
  }, []);

  useEffect(() => {
    if (cvUrl) {
      setStatusMsg("CV încărcat. Analiza începe automat...");
      handleAnalyze();
    }
  }, [cvUrl]);

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

      if (!res.ok)
        throw new Error((await res.text()) || "Eroare la analiza CV-ului");

      const data = await res.json();
      setRecommendations(data.recommendations || "Nu au fost găsite sugestii.");
      setStatusMsg("Analiza finalizată!");
    } catch (err) {
      console.error(err);
      setError("A apărut o eroare la analiza CV-ului.");
      setStatusMsg("");
    } finally {
      setLoading(false);
    }
  };

  if (!cvUrl)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
          <FileText className="size-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analiză CV</h1>
          <p className="text-gray-600">Nu ai încărcat încă un CV.</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="size-5" />
          Înapoi la profil
        </button>
        {/* LEFT: CV Preview */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Analiză CV</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
              {error}
            </div>
          )}

          <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <iframe
              src={`http://localhost:5000/api/cv/preview_cv?cv_url=${encodeURIComponent(
                cvUrl,
              )}`}
              title="CV Preview"
              className="w-full h-[500px]"
            />

            {loading && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-white size-8 mb-2" />
                <span className="text-white font-semibold">
                  Analiza CV-ului în curs...
                </span>
              </div>
            )}
          </div>

          {statusMsg && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
              <p className="text-gray-600">{statusMsg}</p>
            </div>
          )}
        </div>

        {/* RIGHT: Recommendations */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Rezultat analiză
          </h2>

          {!recommendations && !loading && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
              <Sparkles className="size-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                Așteaptă analiza sau încarcă un CV pentru sugestii.
              </p>
            </div>
          )}

          {recommendations && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-green-200">
              <div className="flex items-center gap-2 mb-3 text-green-600">
                <Sparkles className="size-5" />
                <h3 className="text-lg font-semibold">
                  Recomandări de îmbunătățire
                </h3>
              </div>
              <p className="text-gray-700 whitespace-pre-line">
                {recommendations}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalizaCv;
