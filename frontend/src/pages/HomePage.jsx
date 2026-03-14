import React, { useEffect, useState } from "react";
import JobList from "../components/JobList";
import JobSlider from "../components/JobSlider";
import { Search, MapPin, Briefcase, DollarSign, Clock } from "lucide-react";

const HomePage = () => {
  const [paidJobs, setPaidJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);

  const [loadingPaidJobs, setLoadingPaidJobs] = useState(true);
  const [loadingAllJobs, setLoadingAllJobs] = useState(true);

  // input values
  const [searchInput, setSearchInput] = useState("");
  const [cityInput, setCityInput] = useState("");

  // filters applied
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterExperience, setFilterExperience] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  const uniqueValues = (arr, key) => [
    ...new Set(arr.map((item) => item[key]).filter(Boolean)),
  ];

  // fetch paid jobs
  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/paid")
      .then((res) => res.json())
      .then((data) => {
        setPaidJobs(data);
        setLoadingPaidJobs(false);
      })
      .catch(() => setLoadingPaidJobs(false));
  }, []);

  // fetch all jobs
  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/all")
      .then((res) => res.json())
      .then((data) => {
        setAllJobs(data);
        setFilteredJobs(data);
        setLoadingAllJobs(false);
      })
      .catch(() => setLoadingAllJobs(false));
  }, []);

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setFilterCity(cityInput.toLowerCase());

    const now = new Date();

    const filtered = allJobs.filter((job) => {
      const jobDate = new Date(job.DATA_POSTARE);

      let periodOk = true;

      if (filterPeriod === "24h") {
        periodOk = now - jobDate <= 24 * 60 * 60 * 1000;
      }

      if (filterPeriod === "3d") {
        periodOk = now - jobDate <= 3 * 24 * 60 * 60 * 1000;
      }

      if (filterPeriod === "7d") {
        periodOk = now - jobDate <= 7 * 24 * 60 * 60 * 1000;
      }

      return (
        job.TITLU.toLowerCase().includes(searchInput.toLowerCase()) &&
        (filterCompany === "" || job.DENUMIRE_COMPANIE === filterCompany) &&
        (cityInput === "" ||
          job.LOCATIE.toLowerCase().includes(cityInput.toLowerCase())) &&
        (filterExperience === "" ||
          job.NIVEL_EXPERIENTA === filterExperience) &&
        (filterDomain === "" || job.DOMENIU === filterDomain) &&
        periodOk
      );
    });

    setFilteredJobs(filtered);
    setCurrentPage(1);
  };

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const companyOptions = uniqueValues(allJobs, "DENUMIRE_COMPANIE");
  const experienceOptions = uniqueValues(allJobs, "NIVEL_EXPERIENTA");
  const domainOptions = uniqueValues(allJobs, "DOMENIU");

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Titlu job, cuvinte cheie sau companie"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* City input */}
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Oraș, județ sau cod poștal"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Caută
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Experience */}
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-gray-600" />
            <select
              value={filterExperience}
              onChange={(e) => setFilterExperience(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Toate nivelurile de experiență</option>
              {experienceOptions.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          {/* Domain */}
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-gray-600" />
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Toate domeniile</option>
              {domainOptions.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-gray-600" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Orice perioadă</option>
              <option value="24h">Ultimele 24 de ore</option>
              <option value="3d">Ultimele 3 zile</option>
              <option value="7d">Ultima săptămână</option>
            </select>
          </div>

          {/* Company */}
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-gray-600" />
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Toate companiile</option>
              {companyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Paid Jobs Slider */}
      <div className="mb-8">
        <JobSlider loading={loadingPaidJobs} jobs={paidJobs} />
      </div>

      {/* Job List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Joburi disponibile ({filteredJobs.length})
        </h2>

        <JobList loading={loadingAllJobs} jobs={currentJobs} />

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
    </div>
  );
};

export default HomePage;
