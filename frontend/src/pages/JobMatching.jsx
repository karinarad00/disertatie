import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { ArrowLeft, Target, Calendar, Briefcase, DollarSign, TrendingUp } from "lucide-react";

export default function JobMatching() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
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
      })
      .catch((err) => console.error(err));
  }, [user, navigate]);

  const handlePayment = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/stripe/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            prodType: "candidate_match",
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

  const handleGoToMatching = (jobId) => {
    navigate(`/candidate-match/${jobId}`);
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
            <Target className="size-8 text-green-600" />
            <h1 className="text-3xl font-bold">Potrivire Inteligentă</h1>
          </div>
          <p className="text-gray-600">Utilizează AI pentru a identifica cei mai buni candidați</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {paid ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Briefcase className="text-green-600 size-5" />
                  Selectează jobul pentru analiză
                </h2>
                <div className="space-y-3">
                  {jobs.length > 0 ? (
                    jobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => handleGoToMatching(job.id)}
                        className="flex justify-between items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-green-600 hover:bg-green-50 transition"
                      >
                        <div>
                          <div className="font-semibold">{job.title}</div>
                          <div className="text-sm text-gray-600">
                            {job.applicants || 0} candidați înscriși
                          </div>
                        </div>
                        <div className="text-green-600 font-medium text-sm">
                          Vezi potriviri →
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">Nu ai postat niciun job încă.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6">De ce să alegi AI Matching?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <h3 className="font-bold text-green-900 mb-2">Analiză Semantică</h3>
                    <p className="text-sm text-green-800">
                      Trecem dincolo de cuvinte cheie. AI-ul înțelege contextul și experiența reală.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <h3 className="font-bold text-emerald-900 mb-2">Economie de Timp</h3>
                    <p className="text-sm text-emerald-800">
                      Sortează sute de CV-uri în câteva secunde și concentrează-te pe interviuri.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* INFO */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                Informații serviciu
              </h2>
              <p className="text-green-800 text-sm">
                Abonamentul AI Matcher îți oferă acces nelimitat la analiza CV-urilor pentru toate joburile tale active. 
                Sistemul calculează un scor de potrivire bazat pe cerințele jobului și experiența candidaților.
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {!paid ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold mb-4">Sumar comandă</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Serviciu</span>
                    <span className="font-semibold text-end">Abonament AI Matcher</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Preț</span>
                    <span className="font-semibold">{PRICE} RON/lună</span>
                  </div>
                  <div className="border-t pt-3 mt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-green-600">{PRICE} RON</span>
                  </div>
                </div>
                <button
                  onClick={handlePayment}
                  className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Mergi la plată
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h3 className="font-semibold">Abonament activ</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Ai acces complet la instrumentele de analiză AI. Selectează un job din listă pentru a vedea potrivirile.
                </p>
                <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-xs text-green-700">
                  Următoarea facturare va fi procesată automat prin Stripe.
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg p-6">
              <h3 className="font-bold mb-3">Rezultate estimate</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="size-5" />
                  <span>+80% eficiență în recrutare</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="size-5" />
                  <span>Matching semantic precis</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="size-5" />
                  <span>Reducere timp angajare</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
