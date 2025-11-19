import React, { useEffect, useState } from "react";
import SummaryApi from "../api/SummaryApi";
import Axios from "../api/Axios";
import { CheckCircle, XCircle, Loader2, Laptop, User } from "lucide-react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

function PendingStatus() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingDevices = async () => {
    try {
      setLoading(true);
      const { data } = await Axios({ ...SummaryApi.GetPendingDevice });
      setDevices(data?.data || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
      Swal.fire("Error", "Failed to load pending devices", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const confirm = await Swal.fire({
        title: `Are you sure you want to ${action} this device?`,
        text:
          action === "approve"
            ? "This device will gain access to your account."
            : "This device will be denied access.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText:
          action === "approve" ? "Yes, Approve" : "Yes, Reject",
        confirmButtonColor: action === "approve" ? "#10B981" : "#EF4444",
      });

      if (!confirm.isConfirmed) return;

      await Axios({
        ...SummaryApi.UpdateDevicesStatus(id),
        data: { action },
      });

      Swal.fire(
        "Success",
        `Device ${action === "approve" ? "approved" : "rejected"} successfully`,
        "success"
      );

      fetchPendingDevices();
    } catch (error) {
      Swal.fire("Error", "Action failed. Try again.", "error");
    }
  };

  useEffect(() => {
    fetchPendingDevices();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Pending Device Approvals
        </h2>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-gray-500" size={40} />
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center text-gray-500 bg-white p-8 rounded-2xl shadow-sm">
            <Laptop size={40} className="mx-auto mb-3 text-gray-400" />
            No pending device requests 
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device, index) => (
              <motion.div
                key={device._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-md p-5 hover:shadow-xl transition-all border border-gray-100 relative"
              >
                {/* Device Info */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={device?.LoginUser?.avatar?.url}
                    alt="avatar"
                    className="w-12 h-12 rounded-full border"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {device?.LoginUser?.username || "Unknown User"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {device?.LoginUser?.email}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-4 border">
                  <p className="text-sm text-gray-600 truncate">
                    <strong>Device:</strong> {device?.deviceName || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>IP:</strong> {device?.ip || "Not available"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Requested:</strong>{" "}
                    {new Date(device?.requestedAt).toLocaleString()}
                  </p>
                </div>

                {/* Linked User (Owner) */}
                <div className="flex items-center gap-2 mb-4 text-gray-500 text-sm">
                  <User size={16} />
                  <span>
                    Linked to:{" "}
                    <strong>{device?.linkedUser?.username || "Owner"}</strong>
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between mt-3">
                  <button
                    onClick={() => handleAction(device._id, "approve")}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all shadow-sm"
                  >
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(device._id, "reject")}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all shadow-sm"
                  >
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PendingStatus;
