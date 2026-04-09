import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Phone } from "lucide-react";

const RegisterPage = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    location: "", // id_oras
    experience: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  const [experienceOptions, setExperienceOptions] = useState([]);
  const navigate = useNavigate();

  // Fetch locații și experiență pentru dropdown
  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/filters")
      .then((res) => res.json())
      .then((data) => {
        setLocationOptions(data.locations || []); // [{id_oras, denumire_oras}]
        setExperienceOptions(data.experience || []); // ['Intern', 'Junior', ...]
      })
      .catch((err) => console.error("Eroare la preluarea filtrelor:", err));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        tip_utilizator: "Candidat",
        location: form.location ? Number(form.location) : null, // trimitem id_oras numeric
      };

      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Eroare la înregistrare.");
      }

      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">JobFinder</h1>
          <h2 className="text-2xl font-semibold text-gray-800">Înregistrare</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Creează-ți un cont pentru a aplica la joburi
          </p>
        </div>

        {error && (
          <p className="text-red-500 mb-4 text-sm text-center">{error}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Nume utilizator"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parolă
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Introdu parola"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon (opțional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Telefon"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* Location Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Locație (opțional)
            </label>
            <select
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              disabled={loading}
            >
              <option value="">Selectează locația</option>
              {locationOptions.map((loc) => (
                <option key={loc.id_oras} value={loc.id_oras}>
                  {loc.denumire_oras}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experiență (opțional)
            </label>
            <select
              name="experience"
              value={form.experience}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              disabled={loading}
            >
              <option value="">Selectează experiența</option>
              {experienceOptions.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            {loading ? "Se înregistrează..." : "Înregistrează-te"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Ai deja cont?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Autentifică-te
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            Ești angajatorul unei firme?{" "}
            <Link
              to="/cerere-angajator"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Cere crearea unui cont aici
            </Link>
          </p>
        </div>

        <div className="mt-6">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Înapoi la Pagina Principală
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
