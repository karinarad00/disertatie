import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileCard } from "../components/ProfileCard";
import { CVSection } from "../components/CVSection";
import { FavoriteJobsList } from "../components/FavoriteJobsList";
import { ChangeCVModal } from "../components/ChangeCVModal";
import { EditProfileModal } from "../components/EditProfileModal";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [favoriteJobs, setFavoriteJobs] = useState([]);
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Logout function
  const logoutAndRedirect = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // Checkout handler
  const handleCheckout = async (prodType) => {
    if (!user) return navigate("/login");

    // Already subscribed
    if (
      (prodType === "analiza_cv" && user.subscriptie_cv === 1) ||
      (prodType === "primeste_sugestii" && user.subscriptie_recomandari === 1)
    ) {
      navigate(prodType === "analiza_cv" ? "/analiza" : "/sugestii");
      return;
    }

    try {
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch(
        "http://localhost:5000/api/stripe/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localUser.token}`,
          },
          body: JSON.stringify({ userId: localUser.id, prodType }),
        },
      );

      if (res.status === 401) return logoutAndRedirect();

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la creare sesiune");

      window.location.href = data.url;
    } catch (err) {
      setError("Eroare la inițierea plății: " + err.message);
    }
  };

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!localUser.token) return setError("Trebuie să fii autentificat.");

      try {
        const res = await fetch("http://localhost:5000/api/users/profil", {
          headers: { Authorization: `Bearer ${localUser.token}` },
        });
        if (res.status === 401) return logoutAndRedirect();
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };
    fetchProfile();
  }, []);

  // Fetch favorite jobs
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user || user.role !== "Candidat") return;
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");

      try {
        const res = await fetch("http://localhost:5000/api/favorites/all", {
          headers: { Authorization: `Bearer ${localUser.token}` },
        });
        if (res.status === 401) return logoutAndRedirect();
        const jobs = await res.json();
        setFavoriteJobs(jobs);
      } catch (err) {
        console.error("Eroare la preluarea joburilor favorite:", err);
      }
    };
    fetchFavorites();
  }, [user]);

  // Delete favorite job
  const handleDeleteFavorite = async (jobId) => {
    const localUser = JSON.parse(localStorage.getItem("user") || "{}");
    try {
      const res = await fetch("http://localhost:5000/api/favorites/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localUser.token}`,
        },
        body: JSON.stringify({ ID_JOB: jobId }),
      });
      if (!res.ok) throw new Error("Eroare la ștergerea jobului favorite");
      setFavoriteJobs((prev) => prev.filter((j) => j.ID_JOB !== jobId));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (error)
    return (
      <div className="text-red-600 font-semibold text-center mt-4">{error}</div>
    );
  if (!user)
    return <div className="italic text-center mt-4">Se încarcă...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile info card */}
        <ProfileCard
          user={user}
          favoriteJobsCount={favoriteJobs.length}
          onEdit={() => setIsEditOpen(true)}
        />

        <div className="lg:col-span-2 space-y-6">
          {/* CV Section */}
          <CVSection
            user={user}
            onCheckout={handleCheckout}
            openModal={() => setIsCVModalOpen(true)}
          />

          {/* Favorites */}
          <FavoriteJobsList
            jobs={favoriteJobs}
            handleDelete={handleDeleteFavorite}
            navigate={navigate}
          />
        </div>
      </main>

      {/* Modals */}
      <ChangeCVModal
        isOpen={isCVModalOpen}
        onClose={() => setIsCVModalOpen(false)}
        user={user}
        setUser={setUser}
        logoutAndRedirect={logoutAndRedirect}
        setError={setError}
      />

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={user}
        onProfileUpdated={(updatedUser) => setUser(updatedUser)}
      />
    </div>
  );
}
