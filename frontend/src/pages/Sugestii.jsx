import React, { useState, useEffect } from "react";
import JobList from "../components/JobList";

const Sugestii = () => {
  const [token, setToken] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  // Load user and CV from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setToken(parsed.token);
      setCvUrl(parsed.cv_url);
    }
  }, []);

  // Fetch job suggestions automatically
  useEffect(() => {
    if (!cvUrl) return;

    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/cv/suggestions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cvUrl }),
        });

        if (!res.ok) throw new Error("Eroare la obținerea sugestiilor.");

        const data = await res.json();
        setJobs(data.jobs || []);
      } catch (err) {
        console.error(err);
        setError("Nu am putut încărca sugestiile de joburi.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
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
      <p className="text-center text-red-600 font-semibold mt-6">{error}</p>
    );
  if (jobs.length === 0)
    return (
      <p className="text-center text-gray-600 mt-6">
        Nu există sugestii de joburi disponibile momentan.
      </p>
    );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Sugestii de joburi pentru tine
      </h2>

      {/* Job List */}
      <JobList loading={loading} jobs={currentJobs} />

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
  );
};

export default Sugestii;
