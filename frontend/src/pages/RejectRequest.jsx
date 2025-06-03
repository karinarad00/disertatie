import { useState } from "react";
import { useParams } from "react-router-dom";

const RejectRequest = () => {
  const { id } = useParams();
  const [motiv, setMotiv] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/cereri-angajatori/${id}/respinge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ motiv }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setMessage("Cererea a fost respinsă cu succes.");
      } else {
        setMessage(`Eroare: ${data.message}`);
      }
    } catch (error) {
      setMessage("Eroare la conectarea cu serverul.");
    }
  };

  return (
    <div>
      <h2>Respingere cerere</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Motivul respingerii:
          <textarea
            value={motiv}
            onChange={(e) => setMotiv(e.target.value)}
            required
            rows={4}
          />
        </label>
        <br />
        <button type="submit">Trimite respingerea</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default RejectRequest;
