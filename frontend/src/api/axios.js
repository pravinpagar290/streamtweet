import axios from "axios";

const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
console.log("Backend URL:", backend);
const baseURL = backend.replace(/\/+$/, "") + "/api/v1";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
