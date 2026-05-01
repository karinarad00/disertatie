import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout, updateProfile } from "../redux/authSlice";
import axios from "../axiosClient";

import { ProfileCard } from "../components/ProfileCard";
import { CVSection } from "../components/CVSection";
import { FavoriteJobsList } from "../components/FavoriteJobsList";
import { ChangeCVModal } from "../components/ChangeCVModal";
import { EditProfileModal } from "../components/EditProfileModal";

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const [error, setError] = useState("");
  const [favoriteJobs, setFavoriteJobs] = useState([]);
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Logout
  const logoutAndRedirect = useCallback(() => {
    dispatch(logout());
    navigate("/login");
  }, [dispatch, navigate]);

  // Checkout handler
  const handleCheckout = async (prodType) => {
    if (!user) return navigate("/login");

    if (
      (prodType === "analiza_cv" && user.subscriptie_cv === 1) ||
      (prodType === "primeste_sugestii" && user.subscriptie_recomandari === 1)
    ) {
      navigate(prodType === "analiza_cv" ? "/analiza" : "/sugestii");
      return;
    }

    try {
      const res = await axios.post("/api/stripe/create-checkout-session", {
        userId: user.id,
        prodType,
      });

      window.location.href = res.data.url;
    } catch (err) {
      setError("Eroare la inițierea plății: " + (err.response?.data?.error || err.message));
    }
  };

  // Fetch profile (sync Redux with backend)
  useEffect(() => {
    const fetchProfile = async () => {
      // If we don't have a user yet, we might be waiting for redux-persist hydration.
      // We don't show an error here, we just wait.
      if (!user?.token) return;

      try {
        setLoadingProfile(true);
        const res = await axios.get("/api/users/profil");
        dispatch(updateProfile(res.data));
        setError(""); 
      } catch (err) {
        console.error("Profile fetch error:", err);
        // axiosClient handles 401/403, so we only handle other errors here
        if (err.response?.status !== 401 && err.response?.status !== 403) {
           setError(err.response?.data?.message || err.message);
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user?.token, dispatch]);

  // Fetch favorite jobs
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.token || user?.role !== "Candidat") return;

      try {
        const res = await axios.get("/api/favorites/all");
        setFavoriteJobs(res.data);
      } catch (err) {
        console.error("Eroare la preluarea joburilor favorite:", err);
      }
    };

    fetchFavorites();
  }, [user?.token, user?.role]);

  // Delete favorite job
  const handleDeleteFavorite = async (jobId) => {
    try {
      await axios.delete("/api/favorites/remove", {
        data: { ID_JOB: jobId },
      });

      setFavoriteJobs((prev) => prev.filter((j) => j.ID_JOB !== jobId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    }
  };

  if (error)
    return (
      <div className="text-red-600 font-semibold text-center mt-4">{error}</div>
    );

  // If no user yet, we are either not logged in or rehydrating
  if (!user) {
    return <div className="italic text-center mt-4">Se încarcă...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProfileCard
          user={user}
          favoriteJobsCount={favoriteJobs.length}
          onEdit={() => setIsEditOpen(true)}
        />

        <div className="lg:col-span-2 space-y-6">
          <CVSection
            user={user}
            onCheckout={handleCheckout}
            openModal={() => setIsCVModalOpen(true)}
          />

          <FavoriteJobsList
            jobs={favoriteJobs}
            handleDelete={handleDeleteFavorite}
            navigate={navigate}
          />
        </div>
      </main>

      <ChangeCVModal
        isOpen={isCVModalOpen}
        onClose={() => setIsCVModalOpen(false)}
        user={user}
        logoutAndRedirect={logoutAndRedirect}
        setError={setError}
      />

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={user}
      />
    </div>
  );
}
