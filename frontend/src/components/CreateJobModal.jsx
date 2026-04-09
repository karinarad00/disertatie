import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { X } from "lucide-react";

export function CreateJobModal({ isOpen, idCompanie, onClose, onJobCreated }) {
  const { user } = useSelector((state) => state.auth);

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

  // Fetch domenii
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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
          Authorization: `Bearer ${user?.token}`,
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
          <input
            name="titlu"
            placeholder="Titlu job"
            value={formData.titlu}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />

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

          <input
            type="text"
            name="linkCariera"
            placeholder="Link site cariere"
            value={formData.linkCariera}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

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
