import React, { useEffect, useState } from "react";

export default function CerereAngajatorPage() {
  const [companii, setCompanii] = useState([]);
  const [formData, setFormData] = useState({
    id_companie: "",
    email: "",
    nume_contact: "",
    telefon: "",
    descriere: "",
  });
  const [message, setMessage] = useState("");

  // Încarcă lista de companii de pe server la montare
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

    // Validări simple
    if (!formData.id_companie || !formData.email) {
      setMessage("Completează toate câmpurile obligatorii.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/users/cereri-angajatori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setMessage(
          "Cererea ta a fost trimisă. Vei fi contactat după aprobare."
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
          "Eroare: " + (errorData.message || "Cererea nu a putut fi trimisă.")
        );
      }
    } catch (err) {
      console.error(err);
      setMessage("Eroare la trimiterea cererii.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Cerere cont angajator</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Companie*:
          <select
            name="id_companie"
            value={formData.id_companie}
            onChange={handleChange}
            required
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="">Selectează compania</option>
            {companii.map((comp) => (
              <option key={comp.ID_COMPANIE} value={comp.ID_COMPANIE}>
                {comp.DENUMIRE_COMPANIE}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          Email*:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>

        <label className="block">
          Nume contact:
          <input
            type="text"
            name="nume_contact"
            value={formData.nume_contact}
            onChange={handleChange}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>

        <label className="block">
          Telefon:
          <input
            type="tel"
            name="telefon"
            value={formData.telefon}
            onChange={handleChange}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>

        <label className="block">
          Descriere cerere:
          <textarea
            name="descriere"
            value={formData.descriere}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Trimite cererea
        </button>
      </form>

      {message && <p className="mt-4 text-center text-red-600">{message}</p>}
    </div>
  );
}
