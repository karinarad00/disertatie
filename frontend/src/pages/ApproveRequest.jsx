import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import axiosClient from "../axiosClient";

const ApproveRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Se procesează aprobarea...");

  useEffect(() => {
    const approve = async () => {
      try {
        const response = await axiosClient.post(`/api/users/cereri-angajatori/${id}/aproba`);

        if (response.status === 200) {
          setStatus("success");
          setMessage("Cererea a fost aprobată cu succes.");
        } else {
          setStatus("error");
          setMessage(`Eroare: ${response.data.message || "A apărut o eroare."}`);
        }
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Eroare la conectarea cu serverul.");
      }
    };

    approve();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          {status === "loading" && (
            <Loader2 className="size-16 text-blue-500 animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle className="size-16 text-green-500" />
          )}
          {status === "error" && (
            <AlertCircle className="size-16 text-red-500" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Status Aprobare
        </h2>
        
        <p className={`text-lg mb-8 ${
          status === "error" ? "text-red-600" : "text-gray-600"
        }`}>
          {message}
        </p>

        <button
          onClick={() => navigate("/")}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Înapoi la Pagina Principală
        </button>
      </div>
    </div>
  );
};

export default ApproveRequest;
