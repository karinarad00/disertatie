import React, { useEffect, useState } from "react";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get user and token from localStorage
    const userString = localStorage.getItem("user");
    if (!userString) {
      setError("Nu ești autentificat.");
      return;
    }

    let user;
    try {
      user = JSON.parse(userString);
    } catch {
      setError("Datele utilizatorului sunt corupte.");
      return;
    }

    const token = user.token;
    if (!token) {
      setError("Token-ul lipsește. Te rugăm să te autentifici din nou.");
      return;
    }

    // Make the API request
    fetch("http://localhost:5000/api/users/profil", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const contentType = res.headers.get("Content-Type");
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Eroare server: ${errorText}`);
        }

        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Răspuns neașteptat de la server: ${text}`);
        }

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

  // Render the UI based on the state
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!user) return <div>Se încarcă...</div>;

  return (
    <div>
      <h1>Profilul utilizatorului</h1>
      <p>Nume utilizator: {user.username}</p>
      <p>Email: {user.email}</p>
      {user.role && <p>Rol: {user.role}</p>}
      {/* Poți adăuga și alte câmpuri, cum ar fi imaginea de profil */}
    </div>
  );
}

export default ProfilePage;
