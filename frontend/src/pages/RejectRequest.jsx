import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { XCircle, MessageSquare, AlertCircle, CheckCircle } from "lucide-react";
import axiosClient from "../axiosClient";

const RejectRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [motiv, setMotiv] = useState("");
  const [status, setStatus] = useState("idle"); // idle, success, error
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosClient.post(
        `/api/users/cereri-angajatori/${id}/respinge`,
        { motiv }
      );

      if (response.status === 200) {
        setStatus("success");
        setMessage("Cererea a fost respinsă cu succes.");
      } else {
        setStatus("error");
        setMessage(`Eroare: ${response.data.message || "A apărut o eroare."}`);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Eroare la conectarea cu serverul.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {status === "success" ? (
              <CheckCircle className="size-16 text-green-500" />
            ) : status === "error" ? (
              <AlertCircle className="size-16 text-red-500" />
            ) : (
              <XCircle className="size-16 text-red-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Respingere Cerere</h2>
          <p className="text-gray-600 mt-2">
            Te rugăm să specifici motivul pentru care această cerere este respinsă.
          </p>
        </div>

        {status === "success" ? (
          <div className="text-center">
            <p className="text-green-600 text-lg mb-8 font-medium">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Înapoi la Pagina Principală
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare className="size-4 text-gray-400" />
                Motivul respingerii
              </label>
              <textarea
                value={motiv}
                onChange={(e) => setMotiv(e.target.value)}
                placeholder="Ex: Documentație incompletă, Date incorecte..."
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                disabled={loading}
              />
            </div>

            {status === "error" && (
              <p className="text-red-500 text-sm text-center font-medium">
                {message}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Se trimite..." : "Trimite respingerea"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Anulează
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RejectRequest;
