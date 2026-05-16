import React, { useEffect, useState, useRef } from "react";
import JobList from "../components/JobList";
import JobSlider from "../components/JobSlider";
import FilterDropdown from "../components/FilterDropdown";
import {
  Search,
  MapPin,
  Building2,
  Briefcase,
  Layers,
  Clock,
  Calendar,
} from "lucide-react";

const HomePage = () => {
  const [paidJobs, setPaidJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [errorJobs, setErrorJobs] = useState(null);

  const [loadingPaidJobs, setLoadingPaidJobs] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");

  const [filterExperience, setFilterExperience] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");

  const [companyOptions, setCompanyOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [experienceOptions, setExperienceOptions] = useState([]);
  const [domainOptions, setDomainOptions] = useState([]);

  const [showSuggestions, setShowSuggestions] = useState({
    search: false,
    city: false,
    company: false,
  });

  const searchRef = useRef(null);
  const cityRef = useRef(null);
  const companyRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const jobsPerPage = 10;

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions((prev) => ({ ...prev, search: false }));
      }
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setShowSuggestions((prev) => ({ ...prev, city: false }));
      }
      if (companyRef.current && !companyRef.current.contains(event.target)) {
        setShowSuggestions((prev) => ({ ...prev, company: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ---------------- AUTOFILL ENGINE ----------------
  const normalize = (s) => (s || "").toString().toLowerCase().trim();

  const getSuggestions = (value, source, mapFn = (x) => x) => {
    if (!value) return [];

    const input = normalize(value);

    return [...new Set(source)]
      .map(mapFn)
      .filter(Boolean)
      .map((item) => {
        const text = normalize(item);

        let score = 0;

        if (text === input) score += 100;
        else if (text.startsWith(input)) score += 80;
        else if (text.includes(input)) score += 50;

        // bonus for word match (better UX)
        if (text.split(" ").some((w) => w.startsWith(input))) {
          score += 20;
        }

        return { item, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.item);
  };

  // promoted jobs
  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/promoted")
      .then((res) => res.json())
      .then((data) => {
        setPaidJobs(data);
        setLoadingPaidJobs(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingPaidJobs(false);
      });
  }, []);

  // filters
  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/filters")
      .then((res) => res.json())
      .then((data) => {
        setCompanyOptions(data.companies);
        setCityOptions(data.locations);
        setExperienceOptions(data.experience);
        setDomainOptions(data.domains);
      })
      .catch(console.error);
  }, []);

  // fetch jobs
  const fetchJobs = async (page = 1) => {
    setLoadingJobs(true);
    setErrorJobs(null);

    try {
      const params = new URLSearchParams({
        search: searchInput,
        city: cityInput,
        company: companyInput,
        experience: filterExperience,
        domain: filterDomain,
        period: filterPeriod,
        page,
        limit: jobsPerPage,
      });

      const res = await fetch(`http://localhost:5000/api/jobs/all?${params}`);

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      setJobs(data.jobs);
      setCurrentPage(page);
      setTotalPages(Math.ceil(data.total / jobsPerPage));
    } catch (err) {
      console.error(err);
      setErrorJobs("Serverul nu este disponibil momentan.");
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs(1);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* SEARCH */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* TITLE */}
          <div ref={searchRef} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
              placeholder="Titlu job..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions((prev) => ({ ...prev, search: true }));
              }}
              onFocus={() =>
                setShowSuggestions((prev) => ({ ...prev, search: true }))
              }
            />

            {showSuggestions.search && searchInput && (
              <div className="absolute w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 overflow-hidden">
                {getSuggestions(
                  searchInput,
                  jobs.map((j) => j.titlu || j.title),
                ).map((s, i) => (
                  <div
                    key={i}
                    className="mx-1 my-0.5 px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 rounded-md"
                    onClick={() => {
                      setSearchInput(s);
                      setShowSuggestions((prev) => ({
                        ...prev,
                        search: false,
                      }));
                    }}
                  >
                    <Search className="size-4 text-gray-500 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CITY */}
          <div ref={cityRef} className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
              placeholder="Oraș..."
              value={cityInput}
              onChange={(e) => {
                setCityInput(e.target.value);
                setShowSuggestions((prev) => ({ ...prev, city: true }));
              }}
              onFocus={() =>
                setShowSuggestions((prev) => ({ ...prev, city: true }))
              }
            />

            {showSuggestions.city && cityInput && (
              <div className="absolute w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 overflow-hidden">
                {getSuggestions(
                  cityInput,
                  cityOptions,
                  (c) => c.denumire_oras,
                ).map((s, i) => (
                  <div
                    key={i}
                    className="mx-1 my-0.5 px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 rounded-md"
                    onClick={() => {
                      setCityInput(s);
                      setShowSuggestions((prev) => ({ ...prev, city: false }));
                    }}
                  >
                    <MapPin className="size-4 text-gray-500 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPANY */}
          <div ref={companyRef} className="flex-1 relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
              placeholder="Companie..."
              value={companyInput}
              onChange={(e) => {
                setCompanyInput(e.target.value);
                setShowSuggestions((prev) => ({ ...prev, company: true }));
              }}
              onFocus={() =>
                setShowSuggestions((prev) => ({ ...prev, company: true }))
              }
            />

            {showSuggestions.company && companyInput && (
              <div className="absolute w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 overflow-hidden">
                {getSuggestions(companyInput, companyOptions).map((s, i) => (
                  <div
                    key={i}
                    className="mx-1 my-0.5 px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 rounded-md"
                    onClick={() => {
                      setCompanyInput(s);
                      setShowSuggestions((prev) => ({
                        ...prev,
                        company: false,
                      }));
                    }}
                  >
                    <Building2 className="size-4 text-gray-500 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => fetchJobs(1)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg"
          >
            Caută
          </button>
        </div>

        {/* FILTERS enhanced */}
        <div className="flex flex-wrap items-center gap-3">
          <FilterDropdown
            icon={Briefcase}
            options={experienceOptions}
            value={filterExperience}
            onChange={setFilterExperience}
            placeholder="Experiență"
          />
          <FilterDropdown
            icon={Layers}
            options={domainOptions}
            value={filterDomain}
            onChange={setFilterDomain}
            placeholder="Domeniu"
          />
          <FilterDropdown
            icon={Clock}
            options={["24h", "3d", "7d"]}
            value={filterPeriod}
            onChange={setFilterPeriod}
            placeholder="Perioadă"
          />
        </div>
      </div>

      <JobSlider loading={loadingPaidJobs} jobs={paidJobs} />

      {errorJobs && (
        <div className="text-center py-6">
          <p className="text-red-500 font-semibold">⚠️ {errorJobs}</p>
          <button
            onClick={() => fetchJobs(1)}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Reîncearcă
          </button>
        </div>
      )}

      <h2 className="text-2xl font-semibold mt-6 mb-4">Joburi disponibile</h2>

      {!errorJobs && <JobList loading={loadingJobs} jobs={jobs} />}

      {/* PAGINATION (UNCHANGED) */}
      <div className="flex justify-center mt-6 gap-2 flex-wrap">
        <button
          onClick={() => fetchJobs(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Precedent
        </button>

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
            for (let i = 1; i <= total; i++) addPage(i);
          } else {
            addPage(1);

            if (currentPage > 3) addDots("start");

            const start = Math.max(2, currentPage - 2);
            const end = Math.min(total - 1, currentPage + 2);

            for (let i = start; i <= end; i++) addPage(i);

            if (currentPage < total - 2) addDots("end");

            addPage(total);
          }

          return pages;
        })()}

        <button
          onClick={() => fetchJobs(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Următor
        </button>
      </div>
    </div>
  );
};

export default HomePage;
