import React, { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom"; // ADDED useLocation
import { toast } from "react-toastify";
import Axios from "../api/Axios";
import SummaryApi from "../api/SummaryApi";
import { Mail, X, Loader2, Shield } from "lucide-react";

function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation

  const shouldRedirectToLogin = location.state?.redirectToLoginOnLoad;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      navigate("/login", { replace: true });
      return;
    }
  }, [shouldRedirectToLogin, navigate]);
  // ------------------------------------------

  const handleCancel = () => {
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.error("Please enter your email address.");
    }

    setIsLoading(true);

    try {
      const { data } = await Axios({
        ...SummaryApi.forgetPassword,
        data: { email },
      });

      if (data?.success) {
        toast.success(
          data?.message || "Please check your inbox for the reset link."
        );
        setEmail("");
      } else {
        toast.error(data?.message || "Could not process request.");
      }
    } catch (error) {
      console.error("Forgot Password Error:", error);
      toast.error("An error occurred. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (shouldRedirectToLogin) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50 transition-opacity duration-300">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-orange-500/20 w-[90%] sm:w-[420px] p-8 flex flex-col gap-6 transform scale-95 opacity-0 animate-scaleIn"
        style={{ animationFillMode: "forwards", animationDuration: "0.3s" }}
        aria-modal="true"
        role="dialog"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-orange-600 dark:text-orange-500">
            Reset Password
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded-full"
            aria-label="Close form"
          >
            <X size={24} />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
          <Shield size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
          Enter the email associated with your account below to receive a secure
          password reset link.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <div className="relative">
              <Mail
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                id="email"
                type="email"
                placeholder="Registered Email Address"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
                autoComplete="email"
                required
              />
            </div>
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl shadow-md transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-orange-500/50 flex items-center justify-center disabled:bg-gray-500"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Sending Link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
        {/* Footer Link */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{" "}
            <RouterLink
              to="/login"
              className="text-orange-600 dark:text-orange-500 font-semibold hover:underline"
            >
              Return to Log In
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgetPassword;
