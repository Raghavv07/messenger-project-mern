import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api`
    : import.meta.env.MODE === "development"
      ? "http://localhost:5001/api"
      : "/api";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Automatically inject Clerk JWT session token or Guest token into outbound requests
axiosInstance.interceptors.request.use(async (config) => {
  try {
    let token = null;

    if (typeof window !== "undefined" && window.Clerk?.session) {
      token = await window.Clerk.session.getToken();
    }

    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("messenger_guest_token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn("Could not attach auth token to request:", error);
  }
  return config;
});
