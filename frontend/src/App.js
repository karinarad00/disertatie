import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RequestReset from "./pages/RequestResetPage";
import ChangePassword from "./pages/ChangePasswordPage";
import CerereAngajator from "./pages/CerereAngajatorPage";
import ApproveRequest from "./pages/ApproveRequest";
import RejectRequest from "./pages/RejectRequest";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import CompanyPage from "./pages/CompanyPage";
import PromoteJob from "./pages/PromoteJob";
import JobMatching from "./pages/JobMatching";
import CandidateMatch from "./pages/CandidateMatch";
import JobDetailsPage from "./pages/JobDetailsPage";
import MapPage from "./pages/MapPage";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";
import AnalizaCv from "./pages/AnalizaCv";
import Sugestii from "./pages/Sugestii";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  return (
    <Routes>
      {/* Layout wraps all routes */}
      <Route element={<Layout user={user} />}>
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<RequestReset />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/cerere-angajator" element={<CerereAngajator />} />
        <Route path="/cerere/:id/aproba" element={<ApproveRequest />} />
        <Route path="/cerere/:id/respinge" element={<RejectRequest />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/stats" element={<AdminPage />} />
        <Route path="/company" element={<CompanyPage />} />
        <Route path="/promote-job" element={<PromoteJob />} />
        <Route path="/matching" element={<JobMatching />} />
        <Route path="/candidate-match/:id" element={<CandidateMatch />} />
        <Route path="/job/:id" element={<JobDetailsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
        <Route path="/analiza" element={<AnalizaCv />} />
        <Route path="/sugestii" element={<Sugestii />} />
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}

export default App;
