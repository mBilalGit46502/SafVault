import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import Axios from "../../api/Axios";
import SummaryApi from "../../api/SummaryApi";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

function PendingAccess() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [approved, setApproved] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [rejected, setRejected] = useState(false);
  const intervalRef = useRef(null);

  const mainUserId = localStorage.getItem("mainUserId");

  const clearAllUserData = async () => {
    try {
      const { data } = await Axios({
        ...SummaryApi.UserLogoutAndRemove,
      });

      // 🔹 Clear browser storages
      localStorage.clear();
      sessionStorage.clear();

      console.log(
        "✅ All user data cleared (localStorage, sessionStorage, cookies)."
      );
    } catch (error) {
      console.error("❌ Error clearing user data:", error);
    }
  };

  const checkApproval = async () => {
    if (!mainUserId) return;
    setChecking(true);

    try {
      const { data, status } = await Axios({
        ...SummaryApi.GetUpdateDevice(mainUserId),
      });
      console.log(data);

      const devices = data?.data || [];
      const approvedDevice = devices.find((device) => device.isApproved);

      if (data?.success && approvedDevice) {
        toast.success("Device approved! Redirecting...");
        setApproved(true);
        localStorage.setItem("isApproved", true);
        clearInterval(intervalRef.current);
        setTimeout(() => navigate("/dashboard"), 2000);
        return;
      }

      if (devices.length === 0) {
        clearInterval(intervalRef.current);
        const { data } = await Axios({
          ...SummaryApi.UserLogoutAndRemove,
        });

        console.log(data);
        await Swal.fire({
          title: "Access Request Rejected",
          text: "Your device request was rejected by the admin.",
          icon: "error",
          confirmButtonColor: "#e67e22",
        });

        clearAllUserData();
        setRejected(true);
        navigate("/login", { replace: true });
        return;
      }

      if (status === 402 || !approvedDevice) {
        return;
      }
    } catch (err) {
      console.error("Approval check error:", err);

      if (
        err.response &&
        (err.response.status === 404 || err.response.status === 410)
      ) {
        clearInterval(intervalRef.current);

        await Swal.fire({
          title: "Access Request Rejected",
          text: "Your device access was removed by the admin.",
          icon: "error",
          confirmButtonColor: "#e67e22",
        });

        clearAllUserData();
        setRejected(true);
        navigate("/login", { replace: true });
      }
    } finally {
      setChecking(false);
    }
  };

  const handleExit = async () => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "This will cancel your device request and log you out completely.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e67e22",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Cancel Request",
      });

      if (!result.isConfirmed) return;

      await Axios({ ...SummaryApi.UserLogoutAndRemove });
      clearAllUserData();

      await Swal.fire({
        title: "Request Cancelled",
        text: "Your request has been cancelled successfully.",
        icon: "success",
        confirmButtonColor: "#e67e22",
        timer: 1500,
        showConfirmButton: false,
      });

      clearInterval(intervalRef.current);
      navigate("/login", { replace: true });
    } catch {
      Swal.fire("Error", "Logout failed. Please try again.", "error");
    }
  };

  useEffect(() => {
    intervalRef.current = setInterval(checkApproval, 10000);
    return () => clearInterval(intervalRef.current);
  }, []);
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : 10));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  if (rejected) return null; 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition">
      <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-800/60 p-10 rounded-2xl shadow-2xl text-center w-[90%] max-w-md animate-fadeIn">
        {!approved ? (
          <>
            <Clock className="w-14 h-14 text-orange-500 mb-4 animate-pulse mx-auto" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Access Pending Approval
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Your device access is awaiting admin approval. This will refresh
              automatically every 10 seconds.
            </p>

            <button
              onClick={checkApproval}
              disabled={checking}
              className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg transition ${
                checking
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              } text-white font-semibold shadow`}
            >
              {checking ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Check Now ({timeLeft}s)
                </>
              )}
            </button>

            <button
              onClick={handleExit}
              className="mt-5 text-sm text-gray-500 underline hover:text-red-600 transition flex items-center justify-center gap-1 mx-auto"
            >
              <XCircle className="w-4 h-4" /> Exit & Cancel Request
            </button>
          </>
        ) : (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mb-4 animate-bounce mx-auto" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Approved
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your device has been approved! Redirecting to dashboard...
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}

export default PendingAccess;
