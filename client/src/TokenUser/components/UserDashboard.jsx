import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import TokenHeader from "./TokenHeader";
import Swal from "sweetalert2";
import Axios from "../../api/Axios";
import SummaryApi from "../../api/SummaryApi";
import TokenFolders from "./TokenFolders";
import { jwtDecode } from "jwt-decode";

function UserDashboard() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  // ────────────────────── FORCE LOGOUT ON TOKEN EXPIRY ──────────────────────
  const performForceLogout = async (reason = "Your session has expired.") => {
    const token = localStorage.getItem("tokenLogin");

    // Call logout API if token exists
    if (token) {
      try {
        await Axios({
          ...SummaryApi.UserLogoutAndRemove,
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn("Logout API failed during force logout:", err);
      }
    }

    // Clear everything
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
    });

    // Show alert
    Swal.fire({
      title: "Session Expired",
      text: reason,
      icon: "warning",
      timer: 4000,
      showConfirmButton: false,
      toast: false,
    });

    // Force redirect
    navigate("/userlogin", { replace: true });
  };

  // ────────────────────── TOKEN EXPIRY CHECKER (RUNS EVERY SECOND) ──────────────────────
  useEffect(() => {
    const token = localStorage.getItem("tokenLogin");
    if (!token) {
      performForceLogout("No active session found.");
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (err) {
      performForceLogout("Invalid token detected.");
      return;
    }

    const checkTokenExpiry = () => {
      const now = Date.now();
      const expiryTime = decoded.exp * 1000;

      if (now >= expiryTime) {
        performForceLogout("Your access token has expired.");
        return;
      }

      // Optional: Warn user 2 minutes before expiry
      if (now >= expiryTime - 120000) {
        // You can show a toast or update header timer
      }
    };

    // Run immediately
    checkTokenExpiry();

    // Run every second
    const interval = setInterval(checkTokenExpiry, 1000);

    return () => clearInterval(interval);
  }, []);

  // ────────────────────── SERVER VALIDATION + AUTO LOGOUT ON 401/403 ──────────────────────
  useEffect(() => {
    const checkSessionValidity = async () => {
      const token = localStorage.getItem("tokenLogin");
      if (!token) return;

      try {
        await Axios({
          ...SummaryApi.GetUserById,
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        const status = err.response?.status;
        if (
          status === 401 ||
          status === 403 ||
          status === 404 ||
          status === 410
        ) {
          performForceLogout(
            status === 403
              ? "You have been logged out by admin."
              : "Your session is no longer valid."
          );
        }
      }
    };

    // Check now
    checkSessionValidity();

    // Then every 15 seconds
    intervalRef.current = setInterval(checkSessionValidity, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ────────────────────── APPLY THEME ──────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TokenHeader theme={theme} setTheme={setTheme} />
      <TokenFolders />
      <Outlet />
    </div>
  );
}

export default UserDashboard;
