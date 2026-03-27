import React from "react";
import { useNavigate } from "react-router-dom";

const CancelPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.role) {
      navigate("/profile");
      return;
    }

    switch (user.role) {
      case "Candidat":
        navigate("/profile");
        break;
      case "Administrator":
        navigate("/stats");
        break;
      case "Angajator":
        navigate("/company");
        break;
      default:
        navigate("/profile");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
      <h1 className="text-4xl font-bold mb-4 text-red-600">
        Plata a fost anulată
      </h1>
      <p className="text-lg mb-6 text-gray-700">
        Nu am primit plata ta. Poți încerca din nou sau să te întorci la pagina
        de profil și să încerci din nou.
      </p>
      <button
        onClick={handleGoBack}
        className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
      >
        Înapoi la profil
      </button>
    </div>
  );
};

export default CancelPage;
