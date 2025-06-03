import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const RejectRequest = () => {
  const { id } = useParams();
  const [message, setMessage] = useState("Se procesează respingerea...");

  useEffect(() => {
    const reject = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/users/cereri-angajatori/${id}/respinge`,
          {
            method: "POST",
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

    reject();
  }, [id]);

  return <h2>{message}</h2>;
};

export default RejectRequest;
