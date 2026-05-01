import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { resetAuth } from "./redux/authSlice";
import { setAxiosLogoutHandler } from "./axiosClient";

import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RequestReset from "./pages/RequestResetPage";
import ChangePassword from "./pages/ChangePasswordPage";
import CerereAngajatorPage from "./pages/CerereAngajatorPage";
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

const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setAxiosLogoutHandler(() => {
      dispatch(resetAuth());
      localStorage.clear();
      sessionStorage.clear();

      // prevent unnecessary redirects
      if (window.location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    });

    // cleanup to avoid stale handlers
    return () => setAxiosLogoutHandler(null);
  }, [dispatch, navigate]);

  return (
    <Routes>
      <Route element={<Layout user={user} />}>
        {/* Public routes */}
        <Route path="/map" element={<MapPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cerere-angajator" element={<CerereAngajatorPage />} />
        <Route path="/reset-password" element={<RequestReset />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/" element={<HomePage />} />

        {/* Protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company"
          element={
            <ProtectedRoute user={user}>
              <CompanyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promote-job"
          element={
            <ProtectedRoute user={user}>
              <PromoteJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matching"
          element={
            <ProtectedRoute user={user}>
              <JobMatching />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate-match/:id"
          element={
            <ProtectedRoute user={user}>
              <CandidateMatch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job/:id"
          element={
            <ProtectedRoute user={user}>
              <JobDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analiza"
          element={
            <ProtectedRoute user={user}>
              <AnalizaCv />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sugestii"
          element={
            <ProtectedRoute user={user}>
              <Sugestii />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <ProtectedRoute user={user}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cerere/:id/aproba"
          element={
            <ProtectedRoute user={user}>
              <ApproveRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cerere/:id/respinge"
          element={
            <ProtectedRoute user={user}>
              <RejectRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/success"
          element={
            <ProtectedRoute user={user}>
              <SuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cancel"
          element={
            <ProtectedRoute user={user}>
              <CancelPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
