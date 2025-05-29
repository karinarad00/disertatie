import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, tip_utilizator: "Candidat" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Eroare la înregistrare.");
      }

      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4 text-center">Înregistrare</h2>

      {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Parolă"
          value={form.password}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Înregistrează-te
        </button>
      </form>

      <p className="text-sm mt-4 text-center">
        Ai deja cont?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Autentifică-te
        </Link>
      </p>

      <p className="text-sm mt-6 text-center text-gray-600">
        Ești angajatorul unei firme?{" "}
        <Link to="/cerere-angajator" className="text-blue-600 hover:underline">
          Cere crearea unui cont aici
        </Link>
      </p>
    </div>
  );
}
