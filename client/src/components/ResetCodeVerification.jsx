import React, { useState } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import Axios from "../api/Axios";
import SummaryApi from "../api/SummaryApi";
import {
  Lock,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  X,
  Clock,
  Mail,
} from "lucide-react";

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const getStyles = () => ({
  modalBg: "bg-white dark:bg-gray-800",
  shadow: "shadow-2xl shadow-orange-500/30",
  secondaryText: "text-gray-500 dark:text-gray-400",
  accent: "text-orange-600 dark:text-orange-500",
  inputBase:
    "w-full pl-12 pr-12 py-3 border rounded-lg transition-colors duration-200",
  inputActive:
    "border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white",
  inputDisabled:
    "bg-gray-100 dark:bg-gray-900/50 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-700",
  iconClass: "absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400",
  buttonActive:
    "bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-500/50",
  buttonExpired:
    "bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:ring-orange-500/50",
  buttonLoading: "bg-gray-500 disabled:cursor-wait",
});

const StatusMessage = ({ isSuccess, isExpired, styles, userEmail }) => {
  if (isSuccess) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400 flex items-start gap-3 border border-green-300 p-3 rounded-lg bg-green-50 dark:bg-green-900/40 font-medium">
        <CheckCircle
          size={20}
          className="flex-shrink-0 mt-0.5 text-green-500"
        />
        **Success!** Your password has been changed. Use the main button below
        to log in.
      </p>
    );
  }

  if (isExpired) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-3 border border-red-300 p-3 rounded-lg bg-red-50 dark:bg-red-900/40 font-medium">
        <Clock size={20} className="flex-shrink-0 mt-0.5 text-red-500" />
        This reset link is **invalid or expired**. Your password was **NOT
        changed**. Please request a new link.
      </p>
    );
  }

  return (
    <p className={`text-sm ${styles.secondaryText} flex items-start gap-3`}>
      <Lock size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
      Please set a new password for **{userEmail}** to complete the reset.
    </p>
  );
};

function ResetCodeVerification() {
  const navigate = useNavigate();
  const query = useQuery();
  const styles = getStyles();

  const userEmail = query.get("email") || "";
  const resetToken = query.get("token") || "";

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isPasswordResetSuccess, setIsPasswordResetSuccess] = useState(false);

  const hasBadCredentials = !userEmail || !resetToken;
  const isFormDisabled = isTokenExpired || isPasswordResetSuccess;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = async (e) => {
    e.preventDefault();

    if (isFormDisabled || isLoading) return;

    const { newPassword, confirmPassword } = formData;

    if (newPassword.length < 8 && confirmPassword.length < 8) {
      return toast.error("Password must be at least 8 characters long.");
    }
    if (!newPassword || !confirmPassword) {
      return toast.error("Please fill in both password fields.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match.");
    }

    setIsLoading(true);

    try {
      const resetData = {
        email: userEmail,
        token: resetToken,
        newPassword: newPassword,
      };

      const response = await Axios({
        ...SummaryApi.resetPassword,
        data: resetData,
      });

      const data = response.data;

      if (data?.success) {
        toast.success(
          data?.message || "Password successfully reset! You can now log in."
        );
        setFormData({ newPassword: "", confirmPassword: "" });
        setIsPasswordResetSuccess(true);
      } else {
        toast.error(
          data?.message ||
            "Password reset failed. Token may be invalid or expired."
        );
      }
    } catch (error) {
      const errorData = error.response?.data;

      if (
        errorData?.errorType === "EXPIRED_TOKEN" ||
        errorData?.errorType === "INVALID_TOKEN"
      ) {
        const errorMessage =
          errorData.message ||
          "The reset link is invalid or expired. Your password was NOT saved.";

        toast.error(errorMessage);
        setIsTokenExpired(true);
        setFormData({ newPassword: "", confirmPassword: "" });
      } else {
        const errorMessage =
          errorData?.message ||
          "A server error occurred. Please try again later.";
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (hasBadCredentials) {
    return (
      <>
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50">
          <div
            className={`rounded-xl ${styles.modalBg} ${styles.shadow} w-[90%] sm:w-[420px] p-8 text-center`}
          >
            <h3
              className={`text-2xl font-bold text-red-600 dark:text-red-400 mb-4`}
            >
              Verification Link Missing 🛑
            </h3>
            <p className={`${styles.secondaryText} mb-6`}>
              The necessary credentials were not found. Please return to the
              login page to restart the process.
            </p>
            <RouterLink
              to="/login"
              className={`inline-flex items-center justify-center w-full py-3 rounded-lg text-white font-semibold ${styles.buttonExpired} transition shadow-md`}
            >
              <X size={20} className="mr-2" /> Back to Log In
            </RouterLink>
          </div>
        </div>
        <style>{`@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } } .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }`}</style>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50 transition-opacity duration-300">
        <div
          className={`${styles.modalBg} rounded-xl ${styles.shadow} w-[90%] sm:w-[420px] p-8 flex flex-col gap-6 transform scale-95 animate-scaleIn`}
          aria-modal="true"
          role="dialog"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
            <h2 className={`text-3xl font-extrabold ${styles.accent}`}>
              {isPasswordResetSuccess ? "Success! 🎉" : "Reset Password"}
            </h2>
            <button
              onClick={() => navigate("/login")}
              className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-full"
              aria-label="Close and return to login"
            >
              <X size={24} />
            </button>
          </div>

          <StatusMessage
            isSuccess={isPasswordResetSuccess}
            isExpired={isTokenExpired}
            styles={styles}
            userEmail={userEmail}
          />

          <form onSubmit={handleReset} className="space-y-4" autoComplete="off">
            <div className="relative">
              <Lock size={20} className={styles.iconClass} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`${styles.inputBase} ${
                  isFormDisabled ? styles.inputDisabled : styles.inputActive
                }`}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isFormDisabled}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-1 transition ${
                  isFormDisabled
                    ? "text-gray-400"
                    : "text-gray-500 hover:text-orange-500"
                }`}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Lock size={20} className={styles.iconClass} />
              <input
                type="password"
                placeholder="Confirm New Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`${styles.inputBase} ${
                  isFormDisabled ? styles.inputDisabled : styles.inputActive
                }`}
                autoComplete="off"
                required
              />
            </div>

            <button
              type="button"
              onClick={
                isTokenExpired
                  ? () => navigate("/forget-password")
                  : isPasswordResetSuccess
                  ? () => navigate("/login")
                  : handleReset
              }
              disabled={isLoading || isFormDisabled}
              className={`w-full font-semibold py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center text-white ${
                isLoading
                  ? styles.buttonLoading
                  : isTokenExpired
                  ? styles.buttonExpired
                  : styles.buttonActive
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : isTokenExpired ? (
                <>
                  <Mail size={20} className="mr-2" />
                  Request New Reset Link
                </>
              ) : isPasswordResetSuccess ? (
                <>
                  <CheckCircle size={20} className="mr-2" />
                  <RouterLink to="/login">Go to Log In</RouterLink>
                </>
              ) : (
                <>
                  <CheckCircle size={20} className="mr-2" />
                  Save New Password
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className={`text-center text-sm ${styles.secondaryText}`}></p>
          </div>
        </div>
      </div>

      <style>{`@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } } .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }`}</style>
    </>
  );
}

export default ResetCodeVerification;
