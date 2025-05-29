import React, { useEffect, useState } from "react";
import JobSlider from "../components/JobSlider";
import JobList from "../components/JobList";

export default function HomePage() {
  const [paidJobs, setPaidJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/paid")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch active jobs");
        return res.json();
      })
      .then((data) => setPaidJobs(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/all")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch all jobs");
        return res.json();
      })
      .then((data) => {
        setAllJobs(data);
        setFilteredJobs(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const filtered = allJobs.filter((job) =>
      job.TITLU.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredJobs(filtered);
    setCurrentPage(1); // reset to first page on search
  }, [searchTerm, allJobs]);

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Anunțuri promovate</h2>
      <JobSlider jobs={paidJobs} />

      <h2 className="text-2xl font-bold mt-10 mb-4">Toate anunțurile</h2>

      <input
        type="text"
        placeholder="Caută titlul jobului..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border rounded w-full"
      />

      <JobList jobs={currentJobs} />

      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={currentPage === 1}
        >
          ‹
        </button>
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={`px-3 py-1 border rounded ${
              currentPage === index + 1 ? "bg-blue-500 text-white" : ""
            }`}
          >
            {index + 1}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={currentPage === totalPages}
        >
          ›
        </button>
      </div>
    </div>
  );
}
