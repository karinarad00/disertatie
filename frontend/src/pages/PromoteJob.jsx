import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
} from "lucide-react";

export default function PromoteJob() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  const MONTHLY_PRICE = 25;

 useEffect(() => {
   const user = JSON.parse(localStorage.getItem("user"));
   if (!user) return navigate("/login");

   // adăugăm ?promotable=1 pentru a primi doar joburile nepromovate
   fetch(
     `http://localhost:5000/api/jobs/by-company/${user.id_companie}?promotable=1`,
   )
     .then((res) => res.json())
     .then((data) => {
       setJobs(data);
       if (data.length > 0) setSelectedJob(data[0].id);
     })
     .catch((err) => console.error(err));
 }, [navigate]);

  const handlePayment = async () => {
    if (!selectedJob) return alert("Selectează un job!");
    const user = JSON.parse(localStorage.getItem("user"));

    try {
      const res = await fetch(
        "http://localhost:5000/api/stripe/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            prodType: "promovare_job",
            jobId: selectedJob,
          }),
        },
      );

      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else console.error("Nu am primit URL de checkout:", data);
    } catch (err) {
      console.error("Eroare creare sesiune Stripe:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate("/company")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="size-5" />
          Înapoi la profil companie
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="size-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Promovează Job</h1>
          </div>
          <p className="text-gray-600">Crește vizibilitatea jobului tău</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Select Job */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Selectează jobul</h2>

              <div className="space-y-3">
                {jobs.map((job) => (
                  <label
                    key={job.id}
                    className={`flex justify-between items-center p-4 border-2 rounded-lg cursor-pointer ${
                      selectedJob === job.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={selectedJob === job.id}
                        onChange={() => setSelectedJob(job.id)}
                      />
                      <div>
                        <div className="font-semibold">{job.title}</div>
                        <div className="text-sm text-gray-600">
                          {job.applicants} aplicanți
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* INFO SUBSCRIPTION */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                Informații abonament
              </h2>
              <p className="text-blue-800 text-sm">
                Promovarea este un abonament lunar care se reînnoiește automat.
                Poți anula oricând din profil. Jobul rămâne promovat până la
                finalul perioadei plătite.
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4">Sumar comandă</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Job</span>
                  <span className="font-semibold">
                    {jobs.find((j) => j.id === selectedJob)?.title}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Preț</span>
                  <span className="font-semibold">{MONTHLY_PRICE} RON/lună</span>
                </div>

                <div className="border-t pt-3 mt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-blue-600">
                    {MONTHLY_PRICE} RON
                  </span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Mergi la plată
              </button>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg p-6">
              <h3 className="font-bold mb-3">Rezultate estimate</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Target />
                  <span>+300% vizibilitate</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign />
                  <span>+5x aplicanți</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar />
                  <span>Angajare mai rapidă</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
