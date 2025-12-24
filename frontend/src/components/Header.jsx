import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import { useTheme } from "../Theme/ThemeContext.jsx";

function Header() {
  const { isLoggedIn, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      navigate("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-gray-800 text-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold text-blue-500">
            StreamTweet
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/upload"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`
              }
            >
              Upload
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`
              }
            >
              History
            </NavLink>

            <NavLink
              to="/tweets"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`
              }
            >
              Tweets
            </NavLink>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="px-2 py-1 rounded-md border border-transparent hover:bg-gray-700/60"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          {isLoggedIn ? (
            <>
              <NavLink
                to="/profile"
                className="hidden sm:inline px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700"
              >
                Profile
              </NavLink>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-sm font-medium hover:text-blue-400 disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="hidden sm:block text-sm font-medium hover:text-blue-400"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;
