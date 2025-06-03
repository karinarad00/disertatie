import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RequestReset from "./pages/RequestResetPage";
import ChangePassword from "./pages/ChangePasswordPage";
import CerereAngajator from "./pages/CerereAngajatorPage";
import ApproveRequest from "./pages/ApproveRequest";
import RejectRequest from "./pages/RejectRequest";
import JobDetailsPage from "./pages/JobDetailsPage";
import MapPage from "./pages/MapPage";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<RequestReset />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/cerere-angajator" element={<CerereAngajator />} />
          <Route path="/:id/aproba" element={<ApproveRequest />} />
          <Route path="/:id/respinge" element={<RejectRequest />} />
          <Route path="/job/:id" element={<JobDetailsPage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
