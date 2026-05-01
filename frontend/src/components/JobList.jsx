import JobCard from "./JobCard";
import { useState, useEffect } from "react";
import axios from "../axiosClient";
import { useSelector } from "react-redux";

const JobList = ({ jobs, loading = false }) => {
  const [favorites, setFavorites] = useState([]);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user || user.role !== "Candidat") return;

    const fetchFavorites = async () => {
      try {
        const res = await axios.get("/api/favorites/list");
        setFavorites(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Eroare la preluarea favorite:", err);
        setFavorites([]);
      }
    };

    fetchFavorites();
  }, [user]);

  if (loading) {
    return (
      <ul className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <li
              key={i}
              className="animate-pulse bg-gray-200 p-6 rounded-lg flex gap-4"
            >
              <div className="w-20 h-20 bg-gray-300 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
            </li>
          ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-4">
      {jobs.map((job) => (
        <li key={job.ID_JOB}>
          <JobCard
            job={job}
            isFavorite={
              Array.isArray(favorites) && favorites.includes(job.ID_JOB)
            }
            user={user}
            setFavorites={setFavorites}
          />
        </li>
      ))}
    </ul>
  );
};

export default JobList;
