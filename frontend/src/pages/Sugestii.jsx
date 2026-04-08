import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import JobCard from "../components/JobCard";
import { ArrowLeft, Sparkles, TrendingUp, Target } from "lucide-react";

const Sugestii = () => {
  const [token, setToken] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [jobs, setJobs] = useState([]);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 3;

  const navigate = useNavigate();

  // Load user
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setToken(parsed.token);
      setCvUrl(parsed.cv_url);
    } else {
      setLoading(false);
      setError("Nu ești autentificat.");
    }
  }, []);

  const fetchSuggestions = async () => {
    if (!cvUrl) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/cv/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cvUrl }),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      console.log("Sugestii primite:", data);
      setJobs(data.jobs || []);
      setExplanation(data.explanation || "");
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError("Nu am putut încărca sugestiile de joburi.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cvUrl && token) fetchSuggestions();
  }, [cvUrl, token]);

  // Pagination
  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = jobs.slice(indexOfFirstJob, indexOfLastJob);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="size-5" />
          Înapoi la profil
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="size-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Sugestii de Joburi AI
            </h1>
          </div>
          <p className="text-gray-600">
            Sugestii personalizate bazate pe experiența și CV-ul tău.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Explanation */}
            {explanation && (
              <div className="mb-4 p-4 bg-gray-100 rounded">
                <p className="text-sm text-gray-700">{explanation}</p>
              </div>
            )}

            {/* Job Listings */}
            {loading ? (
              <p className="text-center mt-6">Se încarcă sugestiile...</p>
            ) : error ? (
              <div className="text-center mt-6">
                <p className="text-red-600 font-semibold">{error}</p>
                <button
                  onClick={fetchSuggestions}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Reîncearcă
                </button>
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-center text-gray-600 mt-6">
                Nu există sugestii de joburi disponibile momentan.
              </p>
            ) : (
              <div className="space-y-4">
                {currentJobs.map((job) => (
                  <div key={job.id || job.ID_JOB} className="relative">
                    <div className="absolute -left-3 -top-3 z-10">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
                        <Target className="size-4" />
                        {job.matchScore || "N/A"}% Match
                      </div>
                    </div>
                    <JobCard job={job} />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {jobs.length > jobsPerPage && (
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border rounded ${
                        page === currentPage
                          ? "bg-blue-500 text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Match Criteria */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Match Criteria (100%)
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Abilități",
                    value: 40,
                    color: "bg-blue-600",
                  },
                  {
                    label: "Nivel de experiență",
                    value: 30,
                    color: "bg-green-600",
                  },
                  {
                    label: "Educație",
                    value: 20,
                    color: "bg-purple-600",
                  },
                  {
                    label: "Certificări / cursuri",
                    value: 10,
                    color: "bg-yellow-500",
                  },
                ].map((c) => (
                  <div key={c.label}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">{c.label}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {c.value}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${c.color} h-2 rounded-full`}
                        style={{ width: `${c.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-start gap-3">
                <TrendingUp className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Insight</h4>
                  <p className="text-sm text-green-800">
                    Match-ul fiecărui job este calculat pe baza ponderilor de
                    mai sus. Acestea reflectă cât de bine se potrivește CV-ul
                    tău cu cerințele jobului.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sugestii;
