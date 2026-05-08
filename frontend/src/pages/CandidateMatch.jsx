import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import { ArrowLeft } from "lucide-react";

export default function CandidateMatch() {
  const { id } = useParams(); // id-ul jobului
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noApplications, setNoApplications] = useState(false);

  useEffect(() => {
    if (!user.subscriptie_angajatori) {
      alert(
        "Trebuie să achiziționați Job Matching pentru a accesa această pagină.",
      );
      return navigate("/job-matching");
    }

    const fetchData = async () => {
      try {
        const jobRes = await fetch(`http://localhost:5000/api/jobs/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const jobData = await jobRes.json();
        setJob(jobData);

        const appRes = await fetch(`http://localhost:5000/api/aplicari/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const appData = await appRes.json();

        if (!appData || appData.length === 0) {
          setNoApplications(true);
          return;
        }

        const cvUrls = appData.map((c) => c.CV_URL_APLICARE);

        const matchRes = await fetch("http://localhost:5000/api/cv/job-cv-match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ jobId: parseInt(id), cvUrls }),
        });
        const matchData = await matchRes.json();

        const rankedCandidates = appData.map((app) => {
          const match = matchData.rankedCandidates?.find(
            (c) => c.cvUrl === app.CV_URL_APLICARE,
          );
          return {
            ...app,
            fitScore: match?.fitScore || 0,
            explanation: match?.explanation || "",
            title: match?.title || "N/A",
            location: match?.location || "N/A",
            experience: match?.experience || "N/A",
            skills: match?.skills || [],
            summary: match?.summary || "",
            phone: match?.phone || "N/A",
          };
        });

        rankedCandidates.sort((a, b) => b.fitScore - a.fitScore);
        setCandidates(rankedCandidates);
      } catch (err) {
        console.error("Eroare la preluarea datelor:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  if (loading) return <p className="text-center mt-10">Se încarcă datele...</p>;

  if (!job)
    return (
      <div className="text-center mt-10">
        <p className="text-red-600 mb-4">Jobul nu a fost găsit.</p>
        <button
          onClick={() => navigate("/job-matching")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <ArrowLeft className="size-4" /> Înapoi la Job Matching
        </button>
      </div>
    );

  if (noApplications)
    return (
      <div className="text-center mt-10">
        <p className="text-gray-700 mb-4">
          Nimeni nu a aplicat încă pentru acest job. Verifică mai târziu.
        </p>
        <button
          onClick={() => navigate("/job-matching")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <ArrowLeft className="size-4" /> Înapoi la Job Matching
        </button>
      </div>
    );

  // --- Dacă există candidați ---
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/matching")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="size-5" />
          Înapoi la Job Matching
        </button>

        {/* Restul componentei CandidateMatch cu afișarea candidaților */}
      </main>
    </div>
  );
}
