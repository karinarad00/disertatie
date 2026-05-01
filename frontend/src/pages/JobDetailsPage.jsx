import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Building2,
  ArrowLeft,
  Bookmark,
  Share2,
} from "lucide-react";
import axios from "axios";

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);

  const formatDate = (isoString) => {
    if (!isoString) return "Data necunoscută";
    const date = new Date(isoString);
    return date.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatSalary = (min, max) => {
    if (min && max) return `${min} - ${max} RON`;
    if (min) return `${min} RON`;
    if (max) return `${max} RON`;
    return "Nedefinit";
  };

  const handleApply = async () => {
    if (!user) return;
    setApplying(true);
    try {
      await axios.post("http://localhost:5000/api/aplicari/add", {
        id_job: job.ID_JOB,
        id_utilizator: user.id_utilizator,
      });
      alert("Aplicație trimisă cu succes!");
    } catch (err) {
      alert("A apărut o eroare la aplicare. Vă rugăm să încercați din nou.");
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/jobs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Jobul nu a fost găsit");
        return res.json();
      })
      .then((data) => {
        setJob(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setJob(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Se încarcă jobul...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Înapoi la joburi
        </button>
      </div>
    );

  if (!job) return null;

  const salaryStr = formatSalary(job.SALARIU_MIN, job.SALARIU_MAX);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="size-5" />
          Înapoi la joburi
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex gap-6 mb-6">
                <div className="size-20 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
                  <Building2 className="size-10" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {job.TITLU}
                  </h1>
                  <p className="text-xl text-gray-700 mb-4">
                    {job.DENUMIRE_COMPANIE || "Companie necunoscută"}
                  </p>
                  <div className="flex flex-wrap gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-5" />
                      <div className="flex flex-col">
                        {job.adrese && job.adrese.length > 0 ? (
                          job.adrese.map((loc, index) => (
                            <span key={index}>
                              {loc.ADDRESS}, {loc.CITY}
                            </span>
                          ))
                        ) : (
                          <span>Locație nedefinită</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="size-5" />
                      {job.TIP_JOB || "Tip job nedefinit"}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="size-5" />
                      {salaryStr}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-5" />
                      {formatDate(job.DATA_POSTARII)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div title={!user ? "Trebuie să fii logat pentru a aplica" : ""}>
                  <button
                    onClick={handleApply}
                    disabled={!user || applying}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {applying ? "Se aplică..." : "Aplică acum"}
                  </button>
                </div>
                <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Bookmark className="size-5" />
                </button>
                <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Share2 className="size-5" />
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Descriere job
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {job.DESCRIERE || "Nu există descriere pentru acest job."}
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Informații rapide
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Nivel experiență</p>
                  <p className="font-semibold">
                    {job.NIVEL_EXPERIENTA || "Nedefinit"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tip job</p>
                  <p className="font-semibold">{job.TIP_JOB || "Nedefinit"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Salariu</p>
                  <p className="font-semibold">{salaryStr}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Companie</p>
                  <p className="font-semibold">
                    {job.DENUMIRE_COMPANIE || "Nedefinit"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Despre companie
              </h3>
              <p className="text-gray-700 text-sm mb-4">
                {job.DENUMIRE_COMPANIE ||
                  "Compania nu a furnizat detalii suplimentare."}
              </p>
              <button className="w-full py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
                Vezi profil companie
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JobDetailsPage;
