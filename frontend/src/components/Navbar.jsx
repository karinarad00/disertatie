import React from "react";
import { useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { MapPin, LogIn, User, Building2, Shield, LogOut } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    dispatch(logout());
    navigate("/login");
  };

  // Dynamic navigation based on role
  const handleProfileClick = () => {
    if (!user) return;

    switch (user.role) {
      case "Candidat":
        navigate("/profile");
        break;
      case "Administrator":
        navigate("/stats");
        break;
      case "Angajator":
        navigate("/company");
        break;
      default:
        navigate("/profile");
    }
  };

  // Get role icon
  const getUserIcon = () => {
    if (!user) return null;

    switch (user.role) {
      case "Candidat":
        return <User className="w-5 h-5" />;
      case "Administrator":
        return <Shield className="w-5 h-5" />;
      case "Angajator":
        return <Building2 className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <h1
          className="text-3xl font-bold text-blue-600 cursor-pointer"
          onClick={() => navigate("/")}
        >
          JobFinder
        </h1>

        {/* Right-side buttons */}
        <div className="flex items-center gap-4">
          {/* Map button */}
          <button
            onClick={() => navigate("/map")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MapPin className="w-5 h-5" />
            <span>Hartă</span>
          </button>

          {/* User buttons */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Profile / Dashboard button */}
              <button
                onClick={handleProfileClick}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={
                  user.role === "Candidat"
                    ? "Profil"
                    : user.role === "Administrator"
                      ? "Statistici"
                      : "Companie"
                }
              >
                {getUserIcon()}
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
