import React from "react";
import { useNavigate } from "react-router-dom";

function CancelPage() {
  const navigate = useNavigate();

  return (
    <div className="text-center mt-10">
      <h1>Plata a fost anulată.</h1>
      <button
        onClick={() => navigate("/pagina-produs")}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        Înapoi la produs
      </button>
    </div>
  );
}

export default CancelPage;
