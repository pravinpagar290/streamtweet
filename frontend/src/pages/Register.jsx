import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !password || !avatar) {
      setError("Username, email, password, and avatar are required.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("avatar", avatar);

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    try {
      const response = await api.post("/user/register", formData);

      console.log("Registration successful:", response.data);
      navigate("/login");
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg =
        err?.response?.data?.message ??
        err?.response?.data?.data?.message ??
        err?.response?.data?.error ??
        err?.normalizedMessage;
      if (status === 409) {
        setError(
          serverMsg || "An account with that email/username already exists."
        );
      } else if (status === 400) {
        setError(serverMsg || "Invalid registration data.");
      } else {
        setError(
          serverMsg || "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-300"
            >
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-300"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="avatar"
              className="block text-sm font-medium text-gray-300"
            >
              Avatar <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="avatar"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files[0])}
              className="mt-1 block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                disabled:opacity-50"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="coverImage"
              className="block text-sm font-medium text-gray-300"
            >
              Cover Image (Optional)
            </label>
            <input
              type="file"
              id="coverImage"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files[0])}
              className="mt-1 block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-gray-600 file:text-white
                hover:file:bg-gray-500
                disabled:opacity-50"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/30 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Registering...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-500 hover:text-blue-400"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
