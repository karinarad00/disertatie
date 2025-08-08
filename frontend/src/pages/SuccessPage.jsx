import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const SuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [productType, setProductType] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
console.log("Session ID:", sessionId);
    if (!sessionId) {
      // fallback
      setProductType("pagina-produs");
      setLoading(false);
      return;
    }

    // Cere backend-ului detalii sesiune
    fetch(`/api/stripe/session/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setProductType(data.prodType || "pagina-produs");
      })
      .catch(() => setProductType("pagina-produs"))
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (!loading && productType) {
      const timer = setTimeout(() => {
        if (productType === "analiza") {
          navigate("/pagina-analiza");
        } else if (productType === "recomandari") {
          navigate("/pagina-recomandari");
        } else {
          navigate("/pagina-produs");
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [loading, productType, navigate]);

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
          if (productType === "analiza") navigate("/pagina-analiza");
          else if (productType === "recomandari")
            navigate("/pagina-recomandari");
          else navigate("/pagina-produs");
        }}
        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
      >
        Mergi către produs
      </button>
    </div>
  );
};

export default SuccessPage;
