import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom"; // Use RouterLink to prevent conflict with Lucide icon
import { toast } from "react-toastify";
import Axios from "../api/Axios";
import SummaryApi from "../api/SummaryApi";
import { useDispatch } from "react-redux";
import { loginUser } from "../storeSlices/userSlice";

import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate("/");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!(formData.email && formData.password)) {
      return toast.error("Please fill all fields.");
    }

    try {
      const { data } = await Axios({
        ...SummaryApi.login,
        data: formData,
      });

      if (data?.error) {
        return toast.error(data?.message || "Login failed!");
      } else if (data?.success) {
        toast.success(data?.message || "Login successful!");
        console.log(data);

        dispatch(
          loginUser({
            _id: data?.data?._id,
            username: data?.data?.username,
            email: data?.data?.email,
            avatar: data.data.avatar,
            token: data?.token,
          })
        );

        localStorage.setItem("accessToken", data?.token);
        localStorage.setItem(
          "userData",
          JSON.stringify({
            _id: data?.data?._id,
            username: data?.data?.username,
            email: data?.data?.email,
            avatar: data.data.avatar,
            token: data?.token,
          })
        );

        navigate("/folder");
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred!";

      return toast.error(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50 animate-fadeIn">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-orange-500/20 w-[90%] sm:w-[420px] p-8 flex flex-col gap-6 transform transition-all duration-300 scale-100"
        aria-modal="true"
        role="dialog"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-orange-600 dark:text-orange-500">
            Welcome Back
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded-full"
            aria-label="Close form"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input with Icon */}
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <Mail
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                id="email"
                type="email"
                placeholder="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-orange-500 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <RouterLink
              to="/forget-password"
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors underline decoration-transparent hover:decoration-orange-500"
            >
              Forgot Password?
            </RouterLink>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl shadow-md transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-orange-500/50"
          >
            Log In to SafVault
          </button>
        </form>
        {" "}
        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don’t have an account?{" "}
            <RouterLink
              to="/signup"
              className="text-orange-600 dark:text-orange-500 font-semibold hover:underline"
            >
              Sign Up
            </RouterLink>
          </p>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Using a secure token?{" "}
            <RouterLink
              to="/userlogin"
              className="text-orange-600 dark:text-orange-500 font-semibold hover:underline"
            >
              Token Login
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
