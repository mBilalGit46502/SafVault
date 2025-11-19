import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import Axios from "../../api/Axios";
import SummaryApi from "../../api/summaryApi";
import { Mail, Key, X, Loader2, User } from "lucide-react";

function UserLogin() {
  const [formData, setFormData] = useState({
    email: "",
    token: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const screenSize = `${window.screen.width}x${window.screen.height}`;
    return `${platform} | ${userAgent} | Screen: ${screenSize}`;
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let cleanedValue = value;

    if (name === "token") {
      cleanedValue = value.replace(/-/g, "");
    }
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: cleanedValue,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!(formData.email && formData.token)) {
      return toast.error("Please fill all fields!");
    }

    try {
      const deviceName = getDeviceInfo();

      const { data } = await Axios({
        ...SummaryApi.tokenUserLogin,
        data: {
          ...formData,
          deviceName,
        },
      });

      console.log("data,", data);

      if (data?.error) {
        return toast.error(data?.message || "Login failed!");
      }

      if (data?.success) {
        toast.success(data?.message || "Login successful!");

        if (data?.accessToken) {
          localStorage.setItem("tokenLogin", data.accessToken);
        }
        if (data?.mainUserId) {
          localStorage.setItem("mainUserId", data.mainUserId);
        }

        navigate("/dashboard");
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong!";
      return toast.error(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-orange-500/20 w-[90%] sm:w-[420px] p-8 flex flex-col gap-6 transform transition-all duration-300 scale-100"
        aria-modal="true"
        role="dialog"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-orange-600 dark:text-orange-500 flex items-center gap-2">
            <User size={28} /> Token Access
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded-full"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter your registered email and the temporary token to access the
          shared area.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Mail
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              placeholder="Your Registered Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
              autoComplete="email"
              required
            />
          </div>

          <div className="relative">
            <Key
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="password"
              placeholder="Paste User Token"
              name="token"
              value={formData.token}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
              autoComplete="off"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl shadow-md transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-orange-500/50 flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Verifying Access...
              </>
            ) : (
              "Login Using Token"
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Have an account?{" "}
            <RouterLink
              to="/login"
              className="text-orange-600 dark:text-orange-500 cursor-pointer font-semibold hover:underline transition-colors"
            >
              Normal Login
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default UserLogin;
