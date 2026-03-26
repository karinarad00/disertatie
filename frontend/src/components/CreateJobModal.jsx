import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function CreateJobModal({ isOpen, idCompanie, onClose, onJobCreated }) {
  const [formData, setFormData] = useState({
    titlu: "",
    tipJob: "",
    nivelExperienta: "",
    salariuMin: "",
    salariuMax: "",
    descriere: "",
    linkCariera: "",
    idDomeniu: "",
    idCompanie: idCompanie,
  });

  const [domenii, setDomenii] = useState([]);

  // Preluăm domeniile din backend la mount
  useEffect(() => {
    async function fetchDomenii() {
      try {
        const res = await fetch("http://localhost:5000/api/domenii/all");
        const data = await res.json();
        setDomenii(data);
      } catch (err) {
        console.error("Eroare la preluarea domeniilor:", err);
      }
    }
    fetchDomenii();
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tipJob) return alert("Selectează tipul jobului!");
    if (!formData.nivelExperienta)
      return alert("Selectează nivelul experienței!");
    if (!formData.idDomeniu) return alert("Selectează domeniul!");

    try {
      const payload = { ...formData, id_companie: idCompanie };

      const res = await fetch("http://localhost:5000/api/jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la crearea jobului");

      onJobCreated?.(); 

      alert("Job creat!");
      onClose(); 
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Creează Job</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titlu */}
          <input
            name="titlu"
            placeholder="Titlu job"
            value={formData.titlu}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />

          {/* Tip Job */}
          <select
            name="tipJob"
            value={formData.tipJob}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Selectează tipul</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Remote">Remote</option>
            <option value="Internship">Internship</option>
          </select>

          {/* Nivel experiență */}
          <select
            name="nivelExperienta"
            value={formData.nivelExperienta}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Selectează nivelul</option>
            <option value="Intern">Intern</option>
            <option value="Internship">Internship</option>
            <option value="Junior">Junior</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
          </select>

          {/* Domeniu */}
          <select
            name="idDomeniu"
            value={formData.idDomeniu}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Selectează domeniul</option>
            {domenii.map((d) => (
              <option key={d.ID_DOMENIU} value={d.ID_DOMENIU}>
                {d.DENUMIRE_DOMENIU}
              </option>
            ))}
          </select>

          {/* Link site cariere */}
          <input
            type="text"
            name="linkCariera"
            placeholder="Link site cariere"
            value={formData.linkCariera}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* Salarii */}
          <div className="flex gap-2">
            <input
              type="number"
              name="salariuMin"
              placeholder="Salariu minim"
              value={formData.salariuMin}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            <input
              type="number"
              name="salariuMax"
              placeholder="Salariu maxim"
              value={formData.salariuMax}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Descriere */}
          <textarea
            name="descriere"
            placeholder="Descriere job"
            value={formData.descriere}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}>
              Anulează
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Creează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
