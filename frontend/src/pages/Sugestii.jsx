import React, { useState, useEffect } from "react";

const Sugestii = () => {
  const [sugestii, setSugestii] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Exemplu de date statice; poate fi înlocuit cu fetch("/api/sugestii")
    const dummyData = [
      { id: 1, text: "Sugestie 1: Actualizează CV-ul" },
      { id: 2, text: "Sugestie 2: Aplică la joburile potrivite" },
      { id: 3, text: "Sugestie 3: Optimizează profilul LinkedIn" },
    ];

    setTimeout(() => {
      setSugestii(dummyData);
      setLoading(false);
    }, 500); // simulare încărcare
  }, []);

  if (loading) return <p>Se încarcă sugestiile...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Sugestii pentru tine
      </h2>
      <ul className="list-disc list-inside space-y-2">
        {sugestii.map((s) => (
          <li key={s.id} className="p-2 border rounded">
            {s.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sugestii;
