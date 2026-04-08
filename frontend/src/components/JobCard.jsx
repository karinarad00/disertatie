// src/components/JobCard.jsx
import React, { useState, useEffect } from "react";
import { MapPin, Clock, DollarSign, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../axiosClient";
import ImageWithFallback from "./ImageWithFallback";

const JobCard = ({ job, isFavorite: initialFavorite, user, setFavorites }) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);

  // Actualizăm starea locală dacă propul de favorite se schimbă
  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      if (!isFavorite) {
        await axios.post(
          "http://localhost:5000/api/favorites/add",
          { ID_JOB: job.ID_JOB },
          config,
        );
        setIsFavorite(true);
        setFavorites((prev) => [...prev, job.ID_JOB]); // actualizăm lista globală
      } else {
        await axios.delete("http://localhost:5000/api/favorites/remove", {
          data: { ID_JOB: job.ID_JOB },
          ...config,
        });
        setIsFavorite(false);
        setFavorites((prev) => prev.filter((id) => id !== job.ID_JOB));
      }
    } catch (err) {
      console.error("Eroare la modificarea favorite:", err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex gap-4">
      <div className="flex-shrink-0">
        <ImageWithFallback
          src={job.LOGO}
          alt={job.DENUMIRE_COMPANIE || "Companie nedefinită"}
          className="w-20 h-20 rounded-lg"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {job.TITLU}
              </h3>
              <p className="text-gray-600">
                {job.DENUMIRE_COMPANIE || "Companie nedefinită"}
              </p>
            </div>

            {user?.role === "Candidat" && (
              <button
                onClick={toggleFavorite}
                className={`transition-colors ${
                  isFavorite
                    ? "text-blue-600"
                    : "text-gray-400 hover:text-blue-600"
                }`}
              >
                <Bookmark className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
            {job.LOCATIE && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{job.LOCATIE}</span>
              </div>
            )}
            {job.TIP_JOB && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{job.TIP_JOB}</span>
              </div>
            )}
            {job.SALARIU && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{job.SALARIU}</span>
              </div>
            )}
          </div>

          {job.DESCRIERE && (
            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
              {job.DESCRIERE}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {job.DATA_POSTARII
              ? new Date(job.DATA_POSTARII).toLocaleDateString("ro-RO")
              : "Dată nedefinită"}
          </span>

          <Link
            to={`/job/${job.ID_JOB}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Vezi detalii
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
