import React, { useState, useEffect } from "react";
import {
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "../axiosClient";

const AnalizaCv = () => {
  const [cvUrl, setCvUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [scores, setScores] = useState({
    score: 0,
    atsCompatibility: 0,
    impact: 0,
    readability: 0,
    strengths: [],
    weaknesses: [],
    suggestions: [],
  });

  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      setCvUrl(user.cv_url);
    }
  }, [user]);

  useEffect(() => {
    if (cvUrl) handleAnalyze();
  }, [cvUrl]);

  const handleAnalyze = async () => {
    if (!cvUrl) return;
    setLoading(true);
    setError("");
    setRecommendations("");
    try {
      const res = await axios.post("/api/cv/analyze", { cvUrl });
      
      const data = res.data;

      setRecommendations(data.recommendations || "");
      setScores({
        score: data.score || 0,
        atsCompatibility: data.atsCompatibility || 0,
        impact: data.impact || 0,
        readability: data.readability || 0,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        suggestions: data.suggestions || [],
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError("A apărut o eroare la analiza CV-ului.");
      }
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="size-5" />
          Înapoi la profil
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CV Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                CV Încărcat
              </h1>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
                  {error}
                </div>
              )}

              <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <iframe
                  src={`http://localhost:5000/api/cv/preview_cv?cv_url=${encodeURIComponent(cvUrl)}`}
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
            </div>
          </div>

          {/* Sidebar with Scores + Pro Tip */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Scor CV</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>ATS</span>
                  <span className="font-semibold">
                    {scores.atsCompatibility}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Impact</span>
                  <span className="font-semibold">{scores.impact}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Lizibilitate</span>
                  <span className="font-semibold">{scores.readability}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Scor general</span>
                  <span className="font-semibold block">{scores.score}%</span>
                </div>
              </div>

              {/* Explanation of Scores */}
              <div className="mt-4 text-sm text-gray-600 space-y-2">
                <p>
                  <strong>ATS:</strong> Scorul CV-ului pentru compatibilitate cu
                  sistemele ATS (aplicații automate).
                </p>
                <p>
                  <strong>Impact:</strong> Cât de bine transmite CV-ul
                  realizările și valoarea candidatului.
                </p>
                <p>
                  <strong>Lizibilitate:</strong> Ușurința de citire și structură
                  a CV-ului.
                </p>
                <p>
                  <strong>Scor general:</strong> Media ponderată a celor trei
                  scoruri anterioare.
                </p>
                <span className="text-right text-gray-400 block -mt-1 italic">
                  Formula: 40% ATS + 35% Impact + 25% Lizibilitate
                </span>
              </div>
            </div>

            {/* Pro Tip Card */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Pro Tip</h4>
                  <p className="text-sm text-blue-800">
                    Personalizează CV-ul pentru fiecare job, folosind
                    cuvinte-cheie relevante din descrierea postului.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations - Full Width Box */}
        {recommendations && (
          <div className="mt-8 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Analiză CV
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Strengths */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4 text-green-600">
                  <CheckCircle className="size-5" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Puncte forte
                  </h3>
                </div>
                <ul className="list-disc list-inside text-gray-700">
                  {scores.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4 text-red-600">
                  <XCircle className="size-5" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Puncte slabe
                  </h3>
                </div>
                <ul className="list-disc list-inside text-gray-700">
                  {scores.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4 text-blue-600">
                  <TrendingUp className="size-5" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Sugestii de îmbunătățire
                  </h3>
                </div>
                <ul className="list-disc list-inside text-gray-700">
                  {scores.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnalizaCv;
