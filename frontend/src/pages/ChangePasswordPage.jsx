import React, { useState } from "react";
import { useLocation } from "react-router-dom";

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const query = new URLSearchParams(useLocation().search);
  const token = query.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "http://localhost:5000/api/users/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        }
      );
      const data = await res.json();
      setMessage(data.message);
    } catch {
      setMessage("Eroare la schimbarea parolei.");
    }
  };

  if (!token) return <p>Link invalid.</p>;

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4">
      <h2>Schimbă parola</h2>
      <input
        type="password"
        placeholder="Noua parolă"
        required
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="border p-2 w-full"
      />
      <button
        type="submit"
        className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
      >
        Schimbă parola
      </button>
      {message && <p className="mt-2">{message}</p>}
    </form>
  );
}
