import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, LayoutDashboard, Timer } from "lucide-react";
import Axios from "../../api/Axios";
import SummaryApi from "../../api/SummaryApi";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";

function TokenHeader({ theme, setTheme }) {
  const navigate = useNavigate();
  const [isApproved, setIsApproved] = useState(
    JSON.parse(localStorage.getItem("isApproved") || "false")
  );
  const [timeLeft, setTimeLeft] = useState(null);
  const [totalDuration, setTotalDuration] = useState(600);
  const [showMenu, setShowMenu] = useState(false);

  const token = localStorage.getItem("tokenLogin");
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  // Smart Timer Logic
  useEffect(() => {
    if (!token || !isApproved) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      try {
        const decoded = jwtDecode(token);
        const duration = decoded.exp - decoded.iat;
        setTotalDuration(duration);
        const remaining = Math.max(0, Math.floor((decoded.exp * 1000 - Date.now()) / 1000));
        if (remaining <= 0) {
          handleAutoLogout();
        } else {
          setTimeLeft(remaining);
        }
      } catch (err) {
        handleAutoLogout();
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [token, isApproved]);

  // Detect approval
  useEffect(() => {
    const check = () => {
      const approved = JSON.parse(localStorage.getItem("isApproved") || "false");
      if (approved && !isApproved) setIsApproved(true);
    };
    check();
    const poll = setInterval(check, 1500);
    return () => clearInterval(poll);
  }, [isApproved]);

  const formatTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const s2 = String(s % 60).padStart(2, "0");
    return `${m}:${s2}`;
  };

  const progress = timeLeft && totalDuration ? (timeLeft / totalDuration) * 100 : 0;

  const getProgressColor = () => {
    if (progress > 66.66) return "bg-green-500";
    if (progress > 33.33) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleAutoLogout = async () => {
    try {
      await Axios({ ...SummaryApi.UserLogoutAndRemove, headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {}
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "tokenLogin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    navigate("/userlogin", { replace: true });
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes",
    }).then(r => r.isConfirmed && handleAutoLogout());
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <header className="w-full sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">

        {/* Logo */}
        <Link to={isApproved ? "/dashboard" : "/pending-access"} className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          Saf<span className="text-gray-900 dark:text-white">Vault</span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-6">

          {/* Smart Timer Bar */}
          {isApproved && timeLeft !== null && (
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-gray-500" />
              <div className="w-32 sm:w-40">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Session</span>
                  <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor()}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* User Dropdown */}
          {token && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {userData?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="hidden sm:block font-medium text-gray-700 dark:text-gray-300">
                  {userData?.username || "User"}
                </span>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => { setShowMenu(false); navigate(isApproved ? "/dashboard" : "/pending-access"); }}
                    className="w-full px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium">Dashboard</span>
                  </button>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => { setShowMenu(false); handleLogout(); }}
                    className="w-full px-5 py-4 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TokenHeader;