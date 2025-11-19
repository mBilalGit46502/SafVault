import React, { useEffect, useState } from "react";
import SummaryApi from "../api/SummaryApi";
import Axios from "../api/Axios";
import { CheckCircle, Loader2, LogOut } from "lucide-react";
import Swal from "sweetalert2";

function ApprovedDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchApprovedDevices = async () => {
    try {
      setLoading(true);
      const { data } = await Axios({ ...SummaryApi.GetApprovedDevice });
      setDevices(data?.data || []);
    } catch (error) {
      console.error("Error fetching approved devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async (deviceId) => {
    try {
      const confirm = await Swal.fire({
        title: "Force Logout?",
        text: "This will immediately revoke access for this device.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e74c3c",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Logout",
      });

      if (!confirm.isConfirmed) return;

      setActionLoading(deviceId);

      const { data } = await Axios({ ...SummaryApi.ForceLogout(deviceId) });
      if (data?.success) {
        setDevices((prev) => prev.filter((d) => d._id !== deviceId)); // instantly remove device
        Swal.fire({
          title: "Device Logged Out",
          text: "The device has been logged out successfully.",
          icon: "success",
          timer: 1300,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", data?.message || "Logout failed", "error");
      }
    } catch (error) {
      console.error("Logout error:", error);
      Swal.fire("Error", "Failed to log out device", "error");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchApprovedDevices();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-white p-6 fade-in">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <CheckCircle className="text-green-600" size={28} />
          Approved Devices
        </h2>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="animate-spin text-gray-500" size={36} />
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center bg-white py-10 px-6 rounded-2xl shadow-sm border border-gray-100">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="No Devices"
              className="w-20 mb-4 opacity-80"
            />
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No Approved Devices
            </h3>
            <p className="text-sm text-gray-500">
              Approved devices will appear here after they’re authorized.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div
                key={device._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6 flex flex-col justify-between fade-in"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={
                        device?.LoginUser?.avatar?.url ||
                        "https://cdn-icons-png.flaticon.com/512/1077/1077012.png"
                      }
                      alt="User Avatar"
                      className="w-12 h-12 rounded-full object-cover border"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">
                        {device?.LoginUser?.username || "Unknown User"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {device?.LoginUser?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <strong>Device:</strong> {device.deviceName}
                    </p>
                    <p>
                      <strong>IP:</strong> {device.ip || "Not available"}
                    </p>
                    <p>
                      <strong>Approved At:</strong>{" "}
                      {new Date(device.approvedAt).toLocaleString()}
                    </p>
                    <p>
                      <strong>User Agent:</strong>{" "}
                      <span className="text-xs text-gray-500 break-all">
                        {device.userAgent?.split("|")[0]}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleForceLogout(device._id)}
                  disabled={actionLoading === device._id}
                  className={`mt-5 flex items-center justify-center gap-2 font-medium py-2 rounded-lg transition-all ${
                    actionLoading === device._id
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {actionLoading === device._id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <LogOut size={18} />
                  )}
                  {actionLoading === device._id
                    ? "Logging out..."
                    : "Force Logout"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .fade-in {
          animation: fadeIn 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default ApprovedDevices;
