import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const SuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [productType, setProductType] = useState(null);
  const [jobId, setJobId] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setProductType("pagina-produs");
      setLoading(false);
      return;
    }

    // Cere backend-ului detalii sesiune Stripe
    fetch(`/api/subscription/session/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setProductType(data.prodType || "pagina-produs");
        setJobId(data.jobId || null);
      })
      .catch(() => setProductType("pagina-produs"))
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (!loading && productType) {
      const timer = setTimeout(() => {
        switch (productType) {
          case "analiza_cv":
            navigate("/analiza");
            break;
          case "primeste_sugestii":
            navigate("/sugestii");
            break;
          case "promovare_job":
            if (jobId) navigate(`/job/${jobId}`);
            else navigate("/company");
            break;
          case "candidate_match":
            if (jobId) navigate(`/candidate-match/${jobId}`);
            else navigate("/company");
            break;
          default:
            navigate("/pagina-produs");
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [loading, productType, jobId, navigate]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-bold mb-4 text-green-600">
        Mulțumim pentru comandă!
      </h1>
      <p className="text-lg mb-6 text-gray-700">
        Vei fi redirecționat către pagina produsului în câteva secunde.
      </p>
      <button
        onClick={() => {
          switch (productType) {
            case "analiza_cv":
              navigate("/analiza");
              break;
            case "primeste_sugestii":
              navigate("/sugestii");
              break;
            case "promovare_job":
              if (jobId) navigate(`/job/${jobId}`);
              else navigate("/company");
              break;
            case "candidate_match":
              if (jobId) navigate(`/candidate-match/${jobId}`);
              else navigate("/company");
              break;
            default:
              navigate("/pagina-produs");
          }
        }}
        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
      >
        Mergi către produs
      </button>
    </div>
  );
};

export default SuccessPage;
