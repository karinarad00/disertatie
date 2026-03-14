import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formatează data_postarii în "28 mai 2025"
  const formatDate = (isoString) => {
    if (!isoString) return "Data necunoscută";
    const date = new Date(isoString);
    return date.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="size-5" />
          Înapoi la joburi
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            {/* HEADER CARD */}
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
                      {job.ADRESA || "Locație nedefinită"}
                    </div>

                    <div className="flex items-center gap-2">
                      <Briefcase className="size-5" />
                      {job.TIP_JOB || "Tip job nedefinit"}
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="size-5" />
                      {job.SALARIU || "Salariu nedefinit"}
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="size-5" />
                      {formatDate(job.DATA_POSTARII)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4">
                <button className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                  Aplică acum
                </button>

                <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Bookmark className="size-5" />
                </button>

                <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Share2 className="size-5" />
                </button>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Descriere job
              </h2>

              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {job.DESCRIERE || "Nu există descriere pentru acest job."}
              </p>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* QUICK INFO */}
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
                  <p className="font-semibold">{job.SALARIU || "Nedefinit"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Companie</p>
                  <p className="font-semibold">
                    {job.DENUMIRE_COMPANIE || "Nedefinit"}
                  </p>
                </div>
              </div>
            </div>

            {/* COMPANY CARD */}
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
