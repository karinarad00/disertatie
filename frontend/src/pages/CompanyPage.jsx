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
import { EditJobModal } from "../components/EditJobModal";
import { CreateJobModal } from "../components/CreateJobModal";

export default function CompanyProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const logoutAndRedirect = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const fetchJobs = async () => {
    if (!user) return;
    try {
      const resJobs = await fetch(
        `http://localhost:5000/api/jobs/by-company/${user.id_companie}`,
      );
      if (!resJobs.ok) throw new Error("Eroare la preluarea joburilor");
      const jobsData = await resJobs.json();
      setJobs(jobsData);
    } catch (err) {
      console.error(err);
    }
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
        const resComp = await fetch(
          `http://localhost:5000/api/companii/${localUser.id_companie}`,
        );
        if (!resComp.ok) throw new Error("Eroare la preluarea companiei");
        const compData = await resComp.json();
        setCompany(compData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [navigate]);

  // Effect separat pentru joburi
  useEffect(() => {
    if (!user) return;
    fetchJobs();
  }, [user]);

  if (loading) return <p className="p-6">Se încarcă datele companiei...</p>;
  if (!company)
    return <p className="p-6 text-red-500">Compania nu a fost găsită.</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow p-4 mb-6">
        <h1 className="text-2xl font-bold">{company.denumire_companie}</h1>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            {company.logo && (
              <img
                src={company.logo}
                alt="Logo"
                className="w-32 h-32 mx-auto mb-4 rounded-lg"
              />
            )}
            <h2 className="text-2xl font-bold mb-2">
              {company.denumire_companie}
            </h2>
            <p className="text-gray-600 mb-4">{company.descriere}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-center">
                <Mail className="size-5" />
                {company.email}
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Phone className="size-5" />
                {company.telefon}
              </div>
              <div className="flex items-start gap-2 justify-center">
                <MapPin className="size-5 mt-1" />
                <div className="text-sm text-left">
                  {company.locations?.length > 0
                    ? company.locations.map((loc, i) => (
                        <div key={i}>{loc.address}</div>
                      ))
                    : "Fără locații"}
                </div>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Globe className="size-5" />
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
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
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
                onClick={() => navigate("/matching")}
                className="flex flex-col items-center gap-3 p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Users className="size-8" />
                <span className="font-semibold">Get Candidate Match</span>
              </button>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Active Job Postings</h2>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
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
                      <button
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setCurrentJob(job);
                          setEditModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => navigate(`/job/${job.id}`)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
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

      {/* Modals */}
      <CreateJobModal
        isOpen={isModalOpen}
        idCompanie={company.id_companie}
        onClose={() => setIsModalOpen(false)}
        onJobCreated={fetchJobs}
      />
      <EditJobModal
        isOpen={editModalOpen}
        jobId={currentJob?.id}
        onClose={() => setEditModalOpen(false)}
        onJobUpdated={fetchJobs}
      />
    </div>
  );
}
