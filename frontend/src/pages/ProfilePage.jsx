import React, { useEffect, useState } from "react";
import "../css/ProfilePage.css"; // 🔔 Import fișier CSS

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (!userString) {
      setError("Nu ești autentificat.");
      return;
    }

    let localUser;
    try {
      localUser = JSON.parse(userString);
    } catch {
      setError("Datele utilizatorului sunt corupte.");
      return;
    }

    const token = localUser.token;
    if (!token) {
      setError("Token-ul lipsește. Te rugăm să te autentifici din nou.");
      return;
    }

    fetch("http://localhost:5000/api/users/profil", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const contentType = res.headers.get("Content-Type");
        if (!res.ok) throw new Error(await res.text());
        if (!contentType || !contentType.includes("application/json"))
          throw new Error("Răspuns invalid de la server.");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setError("");
      })
      .catch((err) => {
        console.error("Eroare la fetch:", err);
        setError(err.message);
        setUser(null);
      });
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!user) return <div className="loading">Se încarcă...</div>;

  return (
    <div className="profile-container">
      <h1>Profilul utilizatorului</h1>
      <p>Nume utilizator: {user.username}</p>
      <p>Email: {user.email}</p>
      <p>Rol: {user.role}</p>
      {user.imagine_profil && (
        <img
          src={user.imagine_profil}
          alt="Imagine profil"
          className="profile-image"
        />
      )}

      {user.role === "Candidat" && (
        <div className="button-group">
          <button className="button">Încarcă CV</button>
          <button className="button paid-button">
            Analizează CV <span className="currency">€</span>
          </button>
        </div>
      )}

      {user.role === "Angajator" && (
        <div className="button-group">
          <button className="button">Promovează anunțurile firmei</button>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
