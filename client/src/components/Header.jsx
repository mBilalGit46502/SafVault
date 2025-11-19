import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Axios from "../api/Axios";
import SummaryApi from "../api/SummaryApi";
import { toast } from "react-toastify";
import { loginUser, logoutUser } from "../storeSlices/userSlice";
import { noImage } from "../assets";
import { jwtDecode } from "jwt-decode";
import ProfileDetail from "./ProfileDetail";
import { FolderPlus, FilePlus, Sun, Moon, LogIn } from "lucide-react";
import FolderInput from "./FolderInput";
import PendingStatus from "./PendingStatus";

function Header({ theme, setTheme }) {
  const [openProfile, setOpenProfile] = useState(false);
  const [openFolder, setOpenFolder] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const profilePopupRef = useRef(null);
  const profileButtonRef = useRef(null);

  const { token } = useSelector((state) => state.user);

  const user = token ? JSON.parse(localStorage.getItem("userData")) : null;

  const handleCreateFolder = () => {
    setOpenFolder(true);
  };

  const isDark = theme === "dark";
  const styles = {
    headerBg: isDark ? "bg-[#112240]" : "bg-white",
    textColor: isDark ? "text-gray-100" : "text-gray-900",
    logoColor: "text-orange-500",
    primaryBtn:
      "bg-orange-500 text-white hover:bg-orange-600 transition duration-200 shadow-lg font-semibold",
    secondaryBtn: isDark
      ? "border-gray-600 text-gray-200 hover:bg-gray-700/50"
      : "border-gray-300 text-gray-700 hover:bg-gray-100",
    profileBorder: "border-orange-500",
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("userData");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const token = parsed?.token;
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem("userData");
            dispatch(logoutUser());
            toast.info("Your session expired. Please log in again.");
          } else {
            dispatch(loginUser(parsed));
          }
        } catch (err) {
          console.error("Invalid token:", err);
          localStorage.removeItem("userData");
          dispatch(logoutUser());
        }
      }
    }
  }, [dispatch]);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (openProfile) {
        const clickedButton =
          profileButtonRef.current &&
          profileButtonRef.current.contains(e.target);

        const clickedInsidePopup =
          profilePopupRef.current && profilePopupRef.current.contains(e.target);

        if (!clickedButton && !clickedInsidePopup) {
          setOpenProfile(false);
        }
      }
    };

    if (openProfile) {
      document.addEventListener("click", handleDocumentClick);
    }

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [openProfile]);

  return (
    <header
      className={`w-full h-[70px] ${styles.headerBg} shadow-xl sticky top-0 flex items-center justify-between px-4 sm:px-8 z-40 transition-colors duration-300`}
    >
      <Link
        to="/"
        className={`text-2xl sm:text-3xl font-extrabold ${styles.logoColor} tracking-wide hover:opacity-80 transition duration-200`}
      >
        Saf<span className={styles.textColor}>Vault</span>
      </Link>

      <div className="flex items-center gap-3 sm:gap-6">
        {token && (
          <>
            <button
              onClick={handleCreateFolder}
              className={`flex items-center gap-1.5 ${styles.primaryBtn} p-2 rounded-full sm:px-3 sm:py-2 sm:rounded-lg text-sm sm:text-base`}
              aria-label="Create New Folder"
            >
              <FolderPlus size={20} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">New Folder</span>
            </button>

            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`p-2 rounded-full border ${styles.secondaryBtn} transition duration-200`}
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </>
        )}

        {token ? (
          <div
            ref={profileButtonRef}
            className={`w-[40px] h-[40px] cursor-pointer rounded-full overflow-hidden border-2 ${styles.profileBorder} transition-transform duration-200 hover:scale-105`}
            onClick={(e) => {
              e.stopPropagation();
              setOpenProfile((prev) => !prev);
            }}
            aria-expanded={openProfile}
            aria-controls="profile-dropdown"
          >
            <img
              className="w-full h-full object-cover"
              src={user?.avatar?.url || noImage}
              alt="User Profile"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`text-sm sm:text-base font-medium ${styles.textColor} hover:text-orange-500 transition duration-200 flex items-center gap-1`}
              aria-label="Login"
            >
              <LogIn size={20} className="sm:hidden" />
              <span className="hidden sm:inline">Login</span>
            </Link>

            <Link
              to="/signup"
              className={`bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base shadow-lg transition duration-200 font-medium`}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {openProfile && (
        <ProfileDetail
          user={user}
          onClose={() => setOpenProfile(false)}
          popupRef={profilePopupRef}
          className={`absolute top-[65px] right-4 sm:right-8`}
        />
      )}

      {openFolder && <FolderInput onClose={() => setOpenFolder(false)} />}
    </header>
  );
}

export default Header;
