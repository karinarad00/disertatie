import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ApproveRequest = () => {
  const { id } = useParams();
  const [message, setMessage] = useState("Se procesează aprobarea...");

  useEffect(() => {
    const approve = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/users/cereri-angajatori/${id}/aproba`,
          {
            method: "POST",
          }
        );

        const data = await response.json();
        if (response.ok) {
          setMessage("Cererea a fost aprobată cu succes.");
        } else {
          setMessage(`Eroare: ${data.message}`);
        }
      } catch (error) {
        setMessage("Eroare la conectarea cu serverul.");
      }
    };

    approve();
  }, [id]);

  return <h2>{message}</h2>;
};

export default ApproveRequest;
