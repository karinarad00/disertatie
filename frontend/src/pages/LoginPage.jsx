import React from "react";

export default function LoginPage({ setUser }) {
  const handleLogin = () => {
    const dummyUser = { username: "candidat", role: "Candidat" };
    localStorage.setItem("user", JSON.stringify(dummyUser));
    setUser(dummyUser);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Autentificare</h2>
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Login demo
      </button>
    </div>
  );
}
