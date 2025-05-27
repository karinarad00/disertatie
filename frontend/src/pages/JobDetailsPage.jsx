import React from "react";
import { useParams } from "react-router-dom";

export default function JobDetailsPage() {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Detalii Anunț #{id}</h2>
      <p>Descriere completă pentru job-ul cu ID-ul {id}.</p>
    </div>
  );
}
