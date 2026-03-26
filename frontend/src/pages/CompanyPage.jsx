import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  TrendingUp,
  Users,
  MapPin,
  Globe,
  Mail,
  Phone,
} from "lucide-react";

export default function CompanyProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const logoutAndRedirect = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    async function fetchData() {
      const userString = localStorage.getItem("user");
      if (!userString) return navigate("/login");

      let localUser;
      try {
        localUser = JSON.parse(userString);
      } catch {
        return navigate("/login");
      }

      setUser(localUser);

      try {
        setLoading(true);

        // 1. Preluăm datele companiei pe baza id
        const resComp = await fetch(
          `http://localhost:5000/api/companii/${localUser.id_companie}`,
        );
        if (!resComp.ok) throw new Error("Eroare la preluarea companiei");
        const compData = await resComp.json();
        setCompany(compData);

        // 2. Preluăm joburile active ale companiei
        const resJobs = await fetch(
          `http://localhost:5000/api/jobs/by-company/${localUser.id_companie}`,
        );
        if (!resJobs.ok) throw new Error("Eroare la preluarea joburilor");
        
        const jobsData = await resJobs.json();
        setJobs(jobsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [navigate]);

  if (loading) return <p className="p-6">Se încarcă datele companiei...</p>;
  if (!company)
    return <p className="p-6 text-red-500">Compania nu a fost găsită.</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow p-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {company.denumire_companie}
        </h1>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            {company.logo && (
              <img
                src={company.logo}
                alt="Logo Companie"
                className="w-32 h-32 mx-auto mb-4 object-cover rounded-lg"
              />
            )}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {company.denumire_companie}
            </h2>
            <p className="text-gray-600 mb-4">{company.descriere}</p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-center text-gray-700">
                <Mail className="size-5 text-gray-400" />
                <span>{company.email}</span>
              </div>
              <div className="flex items-center gap-2 justify-center text-gray-700">
                <Phone className="size-5 text-gray-400" />
                <span>{company.telefon}</span>
              </div>
              <div className="flex items-start gap-2 justify-center text-gray-700">
                <MapPin className="size-5 text-gray-400 mt-1" />
                <div className="text-sm text-left">
                  {company.locations && company.locations.length > 0 ? (
                    company.locations.map((loc, index) => (
                      <div key={index}>{loc.address}</div>
                    ))
                  ) : (
                    <span>Fără locații</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 justify-center text-gray-700">
                <Globe className="size-5 text-gray-400" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {company.website}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex flex-col items-center gap-3 p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="size-8" />
                <span className="font-semibold">Create New Job</span>
              </button>

              <button
                onClick={() => navigate("/promote-job")}
                className="flex flex-col items-center gap-3 p-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <TrendingUp className="size-8" />
                <span className="font-semibold">Promote a Job</span>
              </button>

              <button
                onClick={() => navigate("/candidate-match")}
                className="flex flex-col items-center gap-3 p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Users className="size-8" />
                <span className="font-semibold">Get Candidate Match</span>
              </button>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Active Job Postings
              </h2>
              <span className="text-sm text-gray-500">
                {jobs.length} active
              </span>
            </div>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="size-4" />
                          <span>{job.applicants || 0} applicants</span>
                        </div>
                        <span>Posted {job.posted || "N/A"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                        Edit
                      </button>
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Create Job (Placeholder)</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
