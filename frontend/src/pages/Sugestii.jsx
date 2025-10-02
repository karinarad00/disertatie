import React, { useState, useEffect } from "react";

const Sugestii = () => {
  const [sugestii, setSugestii] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSugestii = async () => {
      const savedUser = localStorage.getItem("user");
      if (!savedUser) {
        setError("Trebuie să fii autentificat pentru a primi sugestii.");
        setLoading(false);
        return;
      }

      const { token } = JSON.parse(savedUser);

      try {
        const res = await fetch("http://localhost:5000/api/cv/suggestions", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Eroare la obținerea sugestiilor.");
        }

        const data = await res.json();
        setSugestii(data.suggestions || []);
      } catch (err) {
        console.error(err);
        setError("Nu am putut încărca sugestiile de joburi.");
      } finally {
        setLoading(false);
      }
    };

    fetchSugestii();
  }, []);

  if (loading)
    return <p className="text-center mt-6">Se încarcă sugestiile...</p>;

  if (error)
    return (
      <p className="text-center text-red-600 font-semibold mt-6">{error}</p>
    );

  if (sugestii.length === 0)
    return (
      <p className="text-center text-gray-600 mt-6">
        Nu există sugestii de joburi disponibile momentan.
      </p>
    );

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Sugestii de joburi pentru tine
      </h2>
      <ul className="space-y-4">
        {sugestii.map((job, idx) => (
          <li
            key={idx}
            className="p-4 border border-gray-200 rounded-lg hover:shadow transition"
          >
            <h3 className="text-lg font-semibold text-blue-700">
              {job.title || "Job fără titlu"}
            </h3>
            <p className="text-gray-600 mb-2">
              {job.company || "Companie necunoscută"}
            </p>
            <p className="text-gray-700">
              {job.description || "Nu există o descriere disponibilă."}
            </p>
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-white bg-green-600 px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Vezi job
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sugestii;
