import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/authActions";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      navigate("/"); 
    }
  }, [user, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(loginUser(username, password));
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4 text-center">Autentificare</h2>

      {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded mt-1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Parolă</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Se autentifică..." : "Autentificare"}
        </button>

        <p className="text-sm mt-2 text-center text-gray-600">
          Ai uitat parola?{" "}
          <Link to="/reset-password" className="text-blue-600 hover:underline">
            Resetează parola
          </Link>
        </p>

        <p className="text-sm mt-4 text-center">
          Nu ai cont?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Înregistrează-te aici
          </Link>
        </p>

        <p className="text-sm mt-6 text-center text-gray-600">
          Ești angajatorul unei firme?{" "}
          <Link
            to="/cerere-angajator"
            className="text-blue-600 hover:underline"
          >
            Cere crearea unui cont aici
          </Link>
        </p>
      </form>
    </div>
  );
}
