import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  ExternalLink,
  Star,
  Award,
} from "lucide-react";

export default function CandidateMatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [includeGlobalPool, setIncludeGlobalPool] = useState(false);

  const fetchData = async () => {
    try {
      setMatchingInProgress(true);
      setCandidates([]);

      const jobRes = await fetch(`http://localhost:5000/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const jobData = await jobRes.json();
      setJob(jobData);
      
      const appRes = await fetch(`http://localhost:5000/api/aplicari/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const appData = await appRes.json();

      let pool = appData.map((a) => ({
        ...a,
        cvUrl: a.CV_URL_APLICARE,
        applied: true,
        userId: a.ID_UTILIZATOR,
        LOCATION: a.LOCATION || "N/A",
      }));

      if (includeGlobalPool) {
        const poolRes = await fetch(
          "http://localhost:5000/api/cv/candidates-pool",
          { headers: { Authorization: `Bearer ${user.token}` } },
        );
        const poolData = await poolRes.json();

        poolData.forEach((p) => {
          if (!pool.find((c) => c.userId === p.ID_UTILIZATOR)) {
            pool.push({
              ID_UTILIZATOR: p.ID_UTILIZATOR,
              USERNAME: p.USERNAME,
              EMAIL: p.EMAIL,
              PHONE: p.PHONE,
              LOCATION: p.LOCATION || "N/A",
              cvUrl: p.CV_URL,
              applied: false,
              userId: p.ID_UTILIZATOR,
            });
          }
        });
      }

      if (!pool.length) {
        setCandidates([]);
        setLoading(false);
        setMatchingInProgress(false);
        return;
      }

      const matchRes = await fetch(
        "http://localhost:5000/api/cv/job-cv-match",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            jobId: parseInt(id),
            cvUrls: pool.map((c) => c.cvUrl),
          }),
        },
      );

      const matchData = await matchRes.json();

      const ranked = pool.map((c) => {
        const m = matchData.rankedCandidates?.find((x) => x.cvUrl === c.cvUrl);
        return {
          ...c,
          fitScore: m?.fitScore || 0,
          explanation: m?.explanation || "",
          title: m?.title || "N/A",
          location: m?.location || c.LOCATION || "N/A",
          experience: m?.experience || "N/A",
          skills: m?.skills || [],
        };
      });

      ranked.sort((a, b) => b.fitScore - a.fitScore);
      setCandidates(ranked);
    } finally {
      setLoading(false);
      setMatchingInProgress(false);
    }
  };

  useEffect(() => {
    if (!user.subscriptie_angajatori) {
      alert("You need subscription access.");
      navigate("/matching");
      return;
    }
    setLoading(true);
    fetchData();
  }, [id, includeGlobalPool]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full mb-4" />
        <p className="text-gray-600">Analyzing candidates...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 mb-4">Job not found</p>
        <button onClick={() => navigate("/matching")} className="text-blue-600">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate("/matching")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="size-5" />
          Back to Matching
        </button>

        {/* Header */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Users className="size-8 text-blue-600" />
            <h1 className="text-3xl font-bold">{job.TITLU}</h1>
          </div>
          <p className="text-xl text-gray-600 font-medium">{job.DENUMIRE_COMPANIE}</p>
          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
            <p className="text-gray-600 font-semibold">
              {candidates.length} candidates analyzed
            </p>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Include global pool</span>
              <button
                onClick={() => setIncludeGlobalPool(!includeGlobalPool)}
                className={`w-11 h-6 flex items-center rounded-full transition ${
                  includeGlobalPool ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`h-4 w-4 bg-white rounded-full transform transition ${
                    includeGlobalPool ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Candidates */}
          <div className="lg:col-span-2 space-y-4">
            {candidates.map((c) => (
              <div
                key={c.userId}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold">{c.USERNAME}</h3>
                    <p className="text-gray-600">{c.title}</p>
                  </div>

                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-semibold flex items-center gap-1">
                    <Star className="size-4" />
                    {Math.round(c.fitScore)}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    {c.LOCATION || "N/A"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-4" />
                    {c.experience}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4" />
                    {c.PHONE || "N/A"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-4" />
                    {c.EMAIL}
                  </div>
                </div>

                <p className="text-sm text-gray-700 italic mb-3">
                  {c.explanation}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {c.skills.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <a
                  href={c.cvUrl}
                  target="_blank"
                  className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
                >
                  View CV <ExternalLink className="size-4" />
                </a>
              </div>
            ))}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-3">Quick Stats</h3>
              <p className="text-sm text-gray-600">
                Candidates: {candidates.length}
              </p>
              <p className="text-sm text-gray-600">
                High match: {candidates.filter((c) => c.fitScore > 80).length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-lg">
              <h3 className="font-bold mb-2">AI Matching</h3>
              <p className="text-sm text-blue-100">
                Candidates are ranked using semantic CV-job matching.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
