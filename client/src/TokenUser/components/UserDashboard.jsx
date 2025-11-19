import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";

// Restoring original relative paths for local components
import TokenHeader from "./TokenHeader";
import TokenFolders from "./TokenFolders";

// Restoring original relative paths for API files
import Axios from "../../api/Axios";
import SummaryApi from "../../api/SummaryApi";

// External packages: You must ensure 'sweetalert2' and 'jwt-decode' are installed
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";

function UserDashboard() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  const clearAllUserData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      // Aggressively clear cookies, including HTTP-only cookies if possible (though less reliable client-side)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    } catch (error) {
      console.error(" Error clearing user data:", error);
    }
  };

  const forceLogout = async (reason = "Session expired or invalid.") => {
    // Attempt graceful backend logout first
    try {
      await Axios({ ...SummaryApi.UserLogoutAndRemove });
    } catch (e) {
      console.warn("Backend logout failed (this is often fine):", e);
    }

    // Clear client-side state
    clearAllUserData();

    // Show user notification
    Swal.fire({
      title: "Logged Out",
      text: reason,
      icon: "info",
      confirmButtonColor: "#e67e22",
      timer: 2000,
      showConfirmButton: false,
    });

    // Redirect to login page
    navigate("/login", { replace: true });
  };

  const checkSessionValidity = async () => {
    const token = localStorage.getItem("tokenLogin");
    if (!token) {
      forceLogout("No session found. Please log in again.");
      return;
    }

    try {
      const response = await Axios({
        ...SummaryApi.GetUserById,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      if (!data.success) {
        forceLogout(data.message || "Session invalid.");
      }

      // If successful, do nothing and let the user continue.
    } catch (err) {
      console.error("Session check failed:", err);
      const status = err.response?.status;

      // Only force logout on specific failure codes related to authorization/user state
      if (status === 401) {
        forceLogout("Session expired. Please log in again.");
      } else if (status === 403) {
        forceLogout("You were force logged out by admin.");
      } else if (status === 404) {
        forceLogout("User not found or deleted.");
      }
      // Added logging for network/CORS issues (which often return no status)
      else if (err.code === "ERR_NETWORK") {
        console.warn(
          "Network error during session check. Will retry on next interval."
        );
      }
    }
  };

  useEffect(() => {
    // Local, synchronous check for JWT expiration. This is fast and reliable.
    const token = localStorage.getItem("tokenLogin");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          console.log("Token expired locally, clearing...");
          localStorage.clear();
          sessionStorage.clear();
          navigate("/userlogin");
        }
      } catch (err) {
        console.error("Invalid token format:", err);
        // Treat invalid format as expired/bad token
        localStorage.clear();
        sessionStorage.clear();
        navigate("/userlogin");
      }
    }
  }, [navigate]);

  useEffect(() => {
    // CRITICAL FIX: We remove the immediate checkSessionValidity() call here.
    // This creates a 10-second grace period to allow the server to synchronize
    // the new token/session after the redirect from the approval page.

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
