import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Phone, Building2 } from "lucide-react";

const CerereAngajatorPage = () => {
  const navigate = useNavigate();
  const [companii, setCompanii] = useState([]);
  const [formData, setFormData] = useState({
    id_companie: "",
    email: "",
    nume_contact: "",
    telefon: "",
    descriere: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/companii/all")
      .then((res) => res.json())
      .then((data) => setCompanii(data))
      .catch((err) => console.error("Eroare la încărcarea companiilor:", err));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!formData.id_companie || !formData.email) {
      setMessage("Completează toate câmpurile obligatorii.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:5000/api/users/cereri-angajatori",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      if (res.ok) {
        setMessage(
          "Cererea ta a fost trimisă. Vei fi contactat după aprobare.",
        );
        setFormData({
          id_companie: "",
          email: "",
          nume_contact: "",
          telefon: "",
          descriere: "",
        });
      } else {
        const errorData = await res.json();
        setMessage(
          "Eroare: " + (errorData.message || "Cererea nu a putut fi trimisă."),
        );
      }
    } catch (err) {
      console.error(err);
      setMessage("Eroare la trimiterea cererii.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">JobFinder</h1>
          <h2 className="text-2xl font-semibold text-gray-800">
            Cerere cont angajator
          </h2>
          <p className="text-gray-600 mt-2">
            Completează formularul pentru a solicita crearea unui cont angajator
          </p>
        </div>

        {message && (
          <p
            className={`mb-4 text-center text-sm ${message.startsWith("Eroare") ? "text-red-500" : "text-green-600"}`}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Companie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Companie*
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <select
                name="id_companie"
                value={formData.id_companie}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={loading}
              >
                <option value="">Selectează compania</option>
                {companii.map((comp) => (
                  <option key={comp.ID_COMPANIE} value={comp.ID_COMPANIE}>
                    {comp.DENUMIRE_COMPANIE}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email*
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Nume contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nume contact
            </label>
            <input
              type="text"
              name="nume_contact"
              value={formData.nume_contact}
              onChange={handleChange}
              placeholder="Nume complet"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="tel"
                name="telefon"
                value={formData.telefon}
                onChange={handleChange}
                placeholder="+40 123 456 789"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* Descriere */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descriere cerere
            </label>
            <textarea
              name="descriere"
              value={formData.descriere}
              onChange={handleChange}
              rows={4}
              placeholder="Descrie scopul contului angajator..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {loading ? "Se trimite..." : "Trimite cererea"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Ai deja cont?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Autentificare
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
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

export default CerereAngajatorPage;
