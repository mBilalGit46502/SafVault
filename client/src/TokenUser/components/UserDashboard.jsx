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

  // ────────────────────── UNIFIED LOGOUT (CALLS BACKEND + CLEARS LOCAL) ──────────────────────
  const performFullLogout = async (
    reason = "Session expired or logged out."
  ) => {
    const token = localStorage.getItem("tokenLogin");

    // 1. Call backend to remove this device from approved list
    if (token) {
      try {
        await Axios({
          ...SummaryApi.UserLogoutAndRemove,
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn("Backend logout failed (might already be invalid):", err);
      }
    }

    // 2. Clear all local data
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // 3. Show message & redirect
    Swal.fire({
      title: "Logged Out",
      text: reason,
      icon: "info",
      confirmButtonColor: "#e67e22",
      timer: 2000,
      showConfirmButton: false,
    });

    navigate("/userlogin", { replace: true });
  };

  // ────────────────────── TOKEN EXPIRY CHECK (NOW CALLS FULL LOGOUT) ──────────────────────
  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = localStorage.getItem("tokenLogin");
      if (!token) {
        performFullLogout("No session found.");
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          performFullLogout("Session expired. Please log in again.");
        }
      } catch (err) {
        performFullLogout("Invalid session token.");
      }
    };

    checkTokenExpiry(); // Check immediately
    const interval = setInterval(checkTokenExpiry, 5000); // Every 5 sec

    return () => clearInterval(interval);
  }, []);

  // ────────────────────── SESSION VALIDATION (KEEP BUT SIMPLIFY) ──────────────────────
  useEffect(() => {
    const checkSessionValidity = async () => {
      const token = localStorage.getItem("tokenLogin");
      if (!token) return;

      try {
        const response = await Axios({
          ...SummaryApi.GetUserById,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success) {
          performFullLogout(response.data.message || "Session invalid.");
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          performFullLogout(
            status === 401
              ? "Session expired."
              : status === 403
              ? "Force logged out by admin."
              : "Account not found."
          );
        }
      }
    };

    checkSessionValidity();
    intervalRef.current = setInterval(checkSessionValidity, 10000);

    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <>
      <TokenHeader theme={theme} setTheme={setTheme} />
      <TokenFolders />
      <Outlet />
    </>
  );
}

export default UserDashboard;
