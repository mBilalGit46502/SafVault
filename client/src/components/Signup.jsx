import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Axios from "../api/Axios";
import SummaryApi from "../api/SummaryApi";
import { User, Mail, Lock, Eye, EyeOff, X, Loader2 } from "lucide-react";

function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(-1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!(formData.email && formData.username && formData.password)) {
      return toast.error("Please fill all fields.");
    }

    if (formData.password.length < 8) {
      return toast.error("Password must be at least 8 characters long.");
    }
    setIsLoading(true);

    try {
      const { data } = await Axios({
        ...SummaryApi.register,
        data: formData,
      });

      if (data?.success) {
        toast.success(data?.message || "Account created successfully!");
        navigate("/login");
      } else {
        toast.error(data?.message || "Something went wrong! Try again.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An unexpected error occurred!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50 transition-opacity duration-300">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-orange-500/20 w-[90%] sm:w-[420px] p-8 flex flex-col gap-6 transform scale-95 opacity-0 animate-scaleIn" // Custom animation class
        style={{ animationFillMode: "forwards", animationDuration: "0.3s" }}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-orange-600 dark:text-orange-500">
            Create SafVault Account
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded-full"
            aria-label="Close form"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
              autoComplete="name"
            />
          </div>

          <div className="relative">
            <Mail
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              placeholder="Email Address"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
                autoComplete="new-password"
                required
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

            <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">
              Password must be at least 8 characters.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl shadow-md transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-orange-500/50 flex items-center justify-center disabled:bg-gray-500"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-orange-600 dark:text-orange-500 font-semibold hover:underline transition-colors"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
