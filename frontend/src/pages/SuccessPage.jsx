import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../axiosClient";

const SuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [productType, setProductType] = useState(null);
  const [jobId, setJobId] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setProductType("profile");
      setLoading(false);
      return;
    }

    // Cere backend-ului detalii sesiune Stripe
    axios.get(`/api/stripe/session/${sessionId}`)
      .then((res) => {
        setProductType(res.data.prodType || "profile");
        setJobId(res.data.jobId || null);
      })
      .catch((err) => {
        console.error("Eroare recuperare sesiune:", err);
        setProductType("profile");
      })
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
            navigate("/profile");
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loading, productType, jobId, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Plată reușită!
        </h1>
        <p className="text-lg mb-8 text-gray-600">
          Vei fi redirecționat automat către pagina produsului în câteva secunde.
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
                navigate("/profile");
            }
          }}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          Mergi către produs
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
