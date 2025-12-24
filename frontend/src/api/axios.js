import axios from "axios";

const backend = "http://localhost:8000";
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const method = error?.config?.method?.toUpperCase();
    const url = error?.config?.url;
    const serverMessage =
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.response?.data?.data?.message ??
      error?.message;

    console.error(
      `[API ERROR] ${status} ${method} ${url} - ${
        serverMessage || "No message"
      }`
    );

    if (status === 401) {
      localStorage.removeItem("token");
    }

    if (status === 409) {
      console.warn("Conflict (409) from server:", serverMessage);
    }

    error.normalizedMessage = serverMessage || "An error occurred";

    return Promise.reject(error);
  }
);

export default api;
