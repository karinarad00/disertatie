import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function JobDetailsPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/jobs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Jobul nu a fost găsit");
        return res.json();
      })
      .then((data) => {
        setJob(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setJob(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Se încarcă...</p>;
  if (error) return <p className="text-red-600">Eroare: {error}</p>;
  if (!job) return null;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">{job.TITLU}</h2>
      <p className="mb-2">
        <strong>Companie:</strong> {job.DENUMIRE_COMPANIE || "Nedefinită"}
      </p>
      <p className="mb-2">
        <strong>Locație:</strong> {job.LOCATIE || "Nedefinită"}
      </p>
      <p className="mb-2">
        <strong>Tip contract:</strong> {job.TIP_CONTRACT || "Nedefinit"}
      </p>
      <p className="mb-2">
        <strong>Salariu:</strong> {job.SALARIU || "Nedefinit"}
      </p>
      <p className="mb-2">
        <strong>Nivel experiență:</strong> {job.NIVEL_EXPERIENTA || "Nedefinit"}
      </p>
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">Descriere</h3>
        <p>{job.DESCRIERE || "Nedefinită"}</p>
      </div>
    </div>
  );
}
