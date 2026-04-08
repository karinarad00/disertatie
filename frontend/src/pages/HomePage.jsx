import React, { useEffect, useState } from "react";
import JobList from "../components/JobList";
import JobSlider from "../components/JobSlider";
import { Search, MapPin, Briefcase, DollarSign, Clock } from "lucide-react";

const HomePage = () => {
  const [paidJobs, setPaidJobs] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [loadingPaidJobs, setLoadingPaidJobs] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [cityInput, setCityInput] = useState("");

  const [filterCompany, setFilterCompany] = useState("");
  const [filterExperience, setFilterExperience] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");

  const [companyOptions, setCompanyOptions] = useState([]);
  const [experienceOptions, setExperienceOptions] = useState([]);
  const [domainOptions, setDomainOptions] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const jobsPerPage = 10;

  // 🔥 Fetch promoted jobs
  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/promoted")
      .then((res) => res.json())
      .then((data) => {
        setPaidJobs(data);
        setLoadingPaidJobs(false);
      })
      .catch(() => setLoadingPaidJobs(false));
  }, []);

  // 🔥 Fetch filter options
  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/filters")
      .then((res) => res.json())
      .then((data) => {
        setCompanyOptions(data.companies);
        setExperienceOptions(data.experience);
        setDomainOptions(data.domains);
      });
  }, []);

  // 🔥 Fetch jobs
  const fetchJobs = async (page = 1) => {
    setLoadingJobs(true);

    const params = new URLSearchParams({
      search: searchInput,
      city: cityInput,
      company: filterCompany,
      experience: filterExperience,
      domain: filterDomain,
      period: filterPeriod,
      page,
      limit: jobsPerPage,
    });

    const res = await fetch(`http://localhost:5000/api/jobs/all?${params}`);
    const data = await res.json();

    setJobs(data.jobs);
    setCurrentPage(page);
    setTotalPages(Math.ceil(data.total / jobsPerPage));

    setLoadingJobs(false);
  };

  // initial load
  useEffect(() => {
    fetchJobs(1);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Titlu job..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
            />
          </div>

          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Oraș..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
            />
          </div>

          <button
            onClick={() => fetchJobs(1)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg"
          >
            Caută
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <select
            value={filterExperience}
            onChange={(e) => setFilterExperience(e.target.value)}
          >
            <option value="">Experiență</option>
            {experienceOptions.map((exp) => (
              <option key={exp} value={exp}>
                {exp}
              </option>
            ))}
          </select>

          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
          >
            <option value="">Domeniu</option>
            {domainOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="">Perioadă</option>
            <option value="24h">24h</option>
            <option value="3d">3 zile</option>
            <option value="7d">7 zile</option>
          </select>

          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
          >
            <option value="">Companie</option>
            {companyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Slider */}
      <JobSlider loading={loadingPaidJobs} jobs={paidJobs} />

      {/* Jobs */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">Joburi disponibile</h2>

      <JobList loading={loadingJobs} jobs={jobs} />

      {/* 🔢 Smart Pagination */}
      <div className="flex justify-center mt-6 gap-2 flex-wrap">
        {/* Prev */}
        <button
          onClick={() => fetchJobs(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {/* Helper to build pages */}
        {(() => {
          const pages = [];

          const addPage = (p) => {
            pages.push(
              <button
                key={p}
                onClick={() => fetchJobs(p)}
                className={`px-3 py-1 border rounded ${
                  p === currentPage ? "bg-blue-500 text-white" : "bg-white"
                }`}
              >
                {p}
              </button>,
            );
          };

          const addDots = (key) => {
            pages.push(
              <span key={key} className="px-2 py-1 text-gray-500">
                ...
              </span>,
            );
          };

          const total = totalPages;

          if (total <= 7) {
            // show all pages if small
            for (let i = 1; i <= total; i++) addPage(i);
          } else {
            // always first page
            addPage(1);

            // left dots
            if (currentPage > 3) addDots("start-dots");

            // middle range
            const start = Math.max(2, currentPage - 2);
            const end = Math.min(total - 1, currentPage + 2);

            for (let i = start; i <= end; i++) {
              addPage(i);
            }

            // right dots
            if (currentPage < total - 2) addDots("end-dots");

            // always last page
            addPage(total);
          }

          return pages;
        })()}

        {/* Next */}
        <button
          onClick={() => fetchJobs(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default HomePage;
