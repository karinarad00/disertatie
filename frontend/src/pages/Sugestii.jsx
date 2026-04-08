import React, { useState, useEffect } from "react";
import JobList from "../components/JobList";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Sugestii = () => {
  const [token, setToken] = useState("");
  const [cvUrl, setCvUrl] = useState("");

  const [jobs, setJobs] = useState([]);
  const [explanation, setExplanation] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

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

  // Fetch when ready
  useEffect(() => {
    if (cvUrl && token) {
      fetchSuggestions();
    }
  }, [cvUrl, token]);

  // Pagination
  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = jobs.slice(indexOfFirstJob, indexOfLastJob);

  if (loading)
    return <p className="text-center mt-6">Se încarcă sugestiile...</p>;

  if (error)
    return (
      <div className="text-center mt-6">
        <p className="text-red-600 font-semibold">{error}</p>
        <button
          onClick={fetchSuggestions}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Reîncearcă
        </button>
      </div>
    );

  if (jobs.length === 0)
    return (
      <p className="text-center text-gray-600 mt-6">
        Nu există sugestii de joburi disponibile momentan.
      </p>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* BACK */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="size-5" />
          Înapoi la profil
        </button>
        <div className="p-4 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Sugestii de joburi pentru tine
          </h2>

          {/* Explanation */}
          {explanation && (
            <div className="mb-4 p-4 bg-gray-100 rounded">
              <p className="text-sm text-gray-700">{explanation}</p>
            </div>
          )}

          {/* Job List */}
          <JobList loading={false} jobs={currentJobs} />

          {/* Pagination */}
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sugestii;
