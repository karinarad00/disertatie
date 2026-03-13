import React from "react";
import { useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { MapPin, LogIn, User, Building2, LogOut } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    localStorage.removeItem("user");
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1
          className="text-3xl font-bold text-blue-600 cursor-pointer"
          onClick={() => navigate("/")}
        >
          JobFinder
        </h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/map")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MapPin className="w-5 h-5" />
            <span>Hartă</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/profile")}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="User Profile"
              >
                <User className="w-5 h-5" />
              </button>

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
