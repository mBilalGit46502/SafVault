// src/api/Axios.js
import axios from "axios";
import { toast } from "react-toastify";
import { BaseUrl } from "./summaryApi";

const Axios = axios.create({
  baseURL: BaseUrl,
  withCredentials: true,
});

function getStoredUser() {
  try {
    const raw = localStorage.getItem("userData");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to parse stored user:", err);
    return null;
  }
}

function clearAllClientAuth(user) {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userData");
  localStorage.removeItem("folder");
  localStorage.clear();

  if (user?.email) localStorage.removeItem(`token_code_${user.email}`);

  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
}

Axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "Something went wrong!";
    const storedUser = getStoredUser();

    if (status === 401) {
      clearAllClientAuth(storedUser);

      window.location.href = "/login";
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export function autoLogoutOnExpiry(token) {
  try {
    if (!token) return;

    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiryTime = payload.exp * 1000;
    const currentTime = Date.now();

    if (currentTime >= expiryTime) {
      localStorage.removeItem("userData");
      localStorage.clear();

      dispatch(logoutUser());
      window.location.href = "/login";
    } else {
      const remainingTime = expiryTime - currentTime;
      setTimeout(() => {
        localStorage.removeItem("userData");
        localStorage.clear();

        dispatch(logoutUser());
        window.location.href = "/login";
      }, remainingTime);
    }
  } catch (err) {
    console.error("Invalid token or expiry check failed:", err);
    window.location.href = "/login";
  }
}

export default Axios;
