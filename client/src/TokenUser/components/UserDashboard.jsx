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
  // Add a state flag to track if the dashboard has fully initialized
  const [isInitialized, setIsInitialized] = useState(false); // NEW STATE FLAG

  const clearAllUserData = () => {
    // ... (rest of the clearAllUserData function remains the same)
    try {
      localStorage.clear();
      sessionStorage.clear();
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
    // ... (rest of the forceLogout function remains the same)
    try {
      await Axios({ ...SummaryApi.UserLogoutAndRemove });
    } catch (e) {
      console.warn("Backend logout failed:", e);
    }
    clearAllUserData();
    Swal.fire({
      title: "Logged Out",
      text: reason,
      icon: "info",
      confirmButtonColor: "#e67e22",
      timer: 2000,
      showConfirmButton: false,
    });
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
    } catch (err) {
      console.error("Session check failed:", err);
      const status = err.response?.status;
      if (status === 401) {
        forceLogout("Session expired. Please log in again.");
      } else if (status === 403) {
        forceLogout("You were force logged out by admin.");
      } else if (status === 404) {
        forceLogout("User not found or deleted.");
      }
    }
  };

  useEffect(() => {
    // This JWT expiration check is fine to run immediately and locally.
    const token = localStorage.getItem("tokenLogin");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          console.log("Token expired, clearing...");
          localStorage.clear();
          sessionStorage.clear();
          navigate("/userlogin");
        }
      } catch (err) {
        console.error("Invalid token:", err);
        localStorage.clear();
        sessionStorage.clear();
        navigate("/userlogin");
      }
    }
  }, [navigate]);

  useEffect(() => {
    // --- CRITICAL CHANGE HERE ---
    // 1. Set the initialization flag. This runs only once.
    setIsInitialized(true);

    // 2. We SKIP the initial immediate checkSessionValidity() call
    // to give the server time to register the new session.

    // 3. Start the interval timer immediately. The first check will run
    // 10 seconds AFTER the component mounts.
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
