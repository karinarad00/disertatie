import React from "react";
import { useNavigate } from "react-router-dom";

function SuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="text-center mt-10">
      <h1>Plata a fost efectuată cu succes!</h1>
      <button
        onClick={() => navigate("/pagina-produs")}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Mergi la produs
      </button>
    </div>
  );
}

export default SuccessPage;
