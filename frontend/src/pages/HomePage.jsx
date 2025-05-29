import React, { useEffect, useState } from "react";
import JobSlider from "../components/JobSlider";
import JobList from "../components/JobList";

export default function HomePage() {
  const [paidJobs, setPaidJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);

  const [loadingPaidJobs, setLoadingPaidJobs] = useState(true);
  const [loadingAllJobs, setLoadingAllJobs] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterExperience, setFilterExperience] = useState("");
  const [filterDomain, setFilterDomain] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  const uniqueValues = (arr, key) => [
    ...new Set(arr.map((item) => item[key]).filter(Boolean)),
  ];

  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/paid")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch active jobs");
        return res.json();
      })
      .then((data) => {
        setPaidJobs(data);
        setLoadingPaidJobs(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingPaidJobs(false);
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/all")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch all jobs");
        return res.json();
      })
      .then((data) => {
        setAllJobs(data);
        setLoadingAllJobs(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingAllJobs(false);
      });
  }, []);

  useEffect(() => {
    const filtered = allJobs.filter((job) => {
      return (
        job.TITLU.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterCompany === "" || job.DENUMIRE_COMPANIE === filterCompany) &&
        (filterCity === "" || job.LOCATIE === filterCity) &&
        (filterExperience === "" ||
          job.NIVEL_EXPERIENTA === filterExperience) &&
        (filterDomain === "" || job.DOMENIU === filterDomain)
      );
    });
    setFilteredJobs(filtered);
    setCurrentPage(1);
  }, [
    allJobs,
    searchTerm,
    filterCompany,
    filterCity,
    filterExperience,
    filterDomain,
  ]);

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const companyOptions = uniqueValues(allJobs, "DENUMIRE_COMPANIE");
  const cityOptions = uniqueValues(allJobs, "LOCATIE");
  const experienceOptions = uniqueValues(allJobs, "NIVEL_EXPERIENTA");
  const domainOptions = uniqueValues(allJobs, "DOMENIU");

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Anunțuri promovate</h2>
      <JobSlider jobs={paidJobs} />

      <h2 className="text-2xl font-bold mt-10 mb-4">Toate anunțurile</h2>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Caută după titlu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Toate companiile</option>
          {companyOptions.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>

        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Toate orașele</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          value={filterExperience}
          onChange={(e) => setFilterExperience(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Toate nivelurile</option>
          {experienceOptions.map((exp) => (
            <option key={exp} value={exp}>
              {exp}
            </option>
          ))}
        </select>

        <select
          value={filterDomain}
          onChange={(e) => setFilterDomain(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Toate domeniile</option>
          {domainOptions.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
      </div>

      <JobList loading={loadingAllJobs} jobs={currentJobs} />

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
}
