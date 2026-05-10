import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { ArrowLeft, Target, Calendar } from "lucide-react";

export default function JobMatching() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [paid, setPaid] = useState(false);

  const PRICE = 40;

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // verificare plată
    setPaid(user.subscriptie_angajatori === 1);

    // fetch joburi
    fetch(`http://localhost:5000/api/jobs/by-company/${user.id_companie}`)
      .then((res) => res.json())
      .then((data) => {
        setJobs(data);
        if (data.length > 0) setSelectedJob(data[0].id);
      })
      .catch((err) => console.error(err));
  }, [navigate]);

  const handlePayment = async () => {
    if (!selectedJob) return alert("Selectează un job!");

    try {
      const res = await fetch(
        "http://localhost:5000/api/stripe/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            prodType: "candidate_match",
            jobId: selectedJob,
          }),
        },
      );

      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else console.error("Nu am primit URL Stripe");
    } catch (err) {
      console.error("Eroare Stripe:", err);
    }
  };

  const handleGoToMatching = () => {
    if (!selectedJob) return alert("Selectează un job!");
    navigate(`/candidate-match/${selectedJob}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* BACK */}
        <button
          onClick={() => navigate("/company")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="size-5" />
          Înapoi la profil companie
        </button>

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="size-8 text-green-600" />
            <h1 className="text-3xl font-bold">Potrivire Joburi</h1>
          </div>
          <p className="text-gray-600">
            Acces complet la procesul automat de matching pentru toate joburile.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* JOB SELECT */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Selectează jobul</h2>

              <div className="space-y-3">
                {jobs.map((job) => (
                  <label
                    key={job.id}
                    className={`flex justify-between items-center p-4 border-2 rounded-lg cursor-pointer ${
                      selectedJob === job.id
                        ? "border-green-600 bg-green-50"
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

            {/* INFO */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                Informații serviciu
              </h2>
              <p className="text-green-800 text-sm">
                Plata se efectuează o singură dată pentru acces complet la toate
                joburile eligibile. Poți vedea candidații și reîmprospăta
                rezultatele oricând.
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* SUMMARY */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4">Sumar comandă</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Job</span>
                  <span className="font-semibold text-end w-[60%]">
                    {jobs.find((j) => j.id === selectedJob)?.title}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Preț</span>
                  <span className="font-semibold">{PRICE} RON</span>
                </div>

                <div className="border-t pt-3 mt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-green-600">
                    {PRICE} RON
                  </span>
                </div>
              </div>

              {/* BUTON PRINCIPAL */}
              <button
                onClick={handlePayment}
                disabled={paid}
                className={`w-full mt-6 py-3 rounded-lg text-white ${
                  paid
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {paid ? "Plata efectuată" : "Plătește pentru acces"}
              </button>

              {/* BUTON MATCHING */}
              {paid && selectedJob && (
                <button
                  onClick={handleGoToMatching}
                  className="w-full mt-3 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Vezi candidații pentru job
                </button>
              )}
            </div>

            {/* STATS */}
            <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-lg p-6">
              <h3 className="font-bold mb-3">Rezultate estimate</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Target />
                  <span>+50% șanse de potrivire</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar />
                  <span>Proces mai rapid de recrutare</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
