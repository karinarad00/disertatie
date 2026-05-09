import { TrendingUp, Sparkles } from "lucide-react";

export function CVSection({ user, onCheckout, openModal }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">CV-ul Meu</h2>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 flex flex-col items-center justify-center">
        {user.cv_url ? (
          <iframe
            src={`http://localhost:5000/api/cv/preview_cv?cv_url=${encodeURIComponent(
              user.cv_url,
            )}`}
            title="Previzualizare CV"
            className="w-full h-[20rem] border rounded"
          />
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-gray-500 mb-2">Nu ai încărcat CV-ul</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Open Modal Button */}
        <button
          onClick={openModal}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          {user.cv_url ? "Actualizează CV" : "Încarcă CV"}
        </button>

        {/* Analizează CV */}
        <button
          onClick={() => onCheckout("analiza_cv")}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition text-white ${
            user.cv_url
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!user.cv_url}
        >
          <TrendingUp className="size-5" />
          Analizează CV
        </button>

        {/* Sugestii Joburi */}
        <button
          onClick={() => onCheckout("primeste_sugestii")}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition text-white ${
            user.cv_url
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!user.cv_url}
        >
          <Sparkles className="size-5" />
          Sugestii Joburi
        </button>
      </div>
    </div>
  );
}
