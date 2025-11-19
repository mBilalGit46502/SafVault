import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  LayoutDashboard,
  Moon,
  Sun,
  Loader2,
} from "lucide-react";
import Axios from "../../api/Axios";
import SummaryApi from "../../api/SummaryApi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

function TokenHeader({ theme, setTheme }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("tokenLogin");
  const userData = JSON.parse(localStorage.getItem("userData"));
  const [openMenu, setOpenMenu] = useState(false);
  const [isApproved, setIsApproved] = useState(
    JSON.parse(localStorage.getItem("isApproved")) || false
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You will be logged out from this device.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e67e22",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Logout",
        background: theme === "dark" ? "#1f2937" : "#ffffff",
        color: theme === "dark" ? "#f3f4f6" : "#111827",
      });

      if (!result.isConfirmed) return;

      setLoading(true);

      const { data } = await Axios({
        ...SummaryApi.UserLogoutAndRemove,
      });

      console.log(data);
      if (data?.success) {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach((cookie) => {
          document.cookie = cookie
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/"
            );
        });
      }

      await Swal.fire({
        title: "Logged out!",
        text: "You’ve been logged out securely.",
        icon: "success",
        confirmButtonColor: "#e67e22",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    } catch (error) {
      console.error("Logout Error:", error);
      Swal.fire({
        title: "Error!",
        text: "Logout failed. Please try again.",
        icon: "error",
        confirmButtonColor: "#e67e22",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="w-full sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm z-50 backdrop-blur-md transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex justify-between items-center h-[70px]">
        {/* 🔹 Logo */}

        <Link
          to={isApproved ? "/dashboard" : "/pending-access"}
          className={`text-2xl sm:text-3xl font-extrabold text-orange-500 tracking-wide hover:opacity-80 transition duration-200`}
        >
          Saf
          <span className={`${"text-gray-900"}`}>Vault</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          {token ? (
            <div className="relative">
              <button
                onClick={() => setOpenMenu((prev) => !prev)}
                disabled={!isApproved || loading}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white transition ${
                  isApproved
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <User size={18} />
                    <span className="hidden sm:inline">
                      {userData?.username || "Token User"}
                    </span>
                    {!isApproved && (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    )}
                  </>
                )}
              </button>

              {openMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                  rounded-lg shadow-xl overflow-hidden animate-slideDown backdrop-blur-sm transition-all"
                >
                  <button
                    onClick={() =>
                      isApproved
                        ? navigate("/dashboard")
                        : navigate("/pending-access")
                    }
                    className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </button>

                  <hr className="border-gray-200 dark:border-gray-700" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-700/30 transition"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-gray-700 dark:text-gray-200 hover:text-orange-600 transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow transition"
              >
                Signup
              </button>
            </>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slideDown {
            animation: slideDown 0.25s ease-out;
          }
        `}
      </style>
    </header>
  );
}

export default TokenHeader;
