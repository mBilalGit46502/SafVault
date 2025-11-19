import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Axios, { autoLogoutOnExpiry } from "./api/Axios";
import { loginUser } from "./storeSlices/userSlice";
import Folder from "./components/Folder";
import SummaryApi from "./api/summaryApi";
import LandingPage from "./LandingPAge";

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const folders = useSelector((state) => state.folder.folders);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const location = useLocation();
  const hideHeaderFooter = location.pathname == "/dashboard";
  const hideFooter = localStorage.getItem("accessToken");

  const isLoggedIn = useSelector((state) => state.user.token);
  const isRootRoute = location.pathname === "/";
  const shouldShowFolder = isLoggedIn && isRootRoute;
  const isLandingPage =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";
  const shouldRenderLandingPage = !isLoggedIn && location.pathname === "/";

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("userData"));
    const savedToken = localStorage.getItem("accessToken");

    if (storedUser && savedToken) {
      dispatch(loginUser({ ...storedUser, token: savedToken }));
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);

    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, [dispatch, theme]);

  useEffect(() => {
    autoLogoutOnExpiry();
  }, []);
  useEffect(() => {
    if (!isLoading) {
      const currentPath = location.pathname;

      if (isLoggedIn) {
        if (
          currentPath === "/" ||
          currentPath === "/login" ||
          currentPath === "/register"
        ) {
          navigate("/folder", { replace: true });
        }
      } else {
        if (
          currentPath.startsWith("/folder") ||
          currentPath === "/security-center"
        ) {
          navigate("/", { replace: true });
        }
      }
    }
  }, [isLoading, isLoggedIn, location.pathname, navigate]); 

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-lg font-medium text-gray-700 dark:text-gray-300 animate-pulse">
          Loading your workspace...
        </div>
      </div>
    );
  }
  if (shouldRenderLandingPage) {
    return <LandingPage />;
  }
  return (
    <>
      <div
        className={`min-h-screen flex flex-col transition duration-300 ${
          theme === "dark"
            ? "dark bg-gray-900 text-gray-100"
            : "bg-gray-50 text-gray-900"
        }`}
      >
        {!hideHeaderFooter && <Header theme={theme} setTheme={setTheme} />}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        {!hideHeaderFooter && hideFooter && <Footer />}
      </div>
      <ToastContainer position="bottom-right" />
    </>
  );
}

export default App;
