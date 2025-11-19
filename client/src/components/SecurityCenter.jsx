import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Axios from "../api/Axios";
import SummaryApi from "../api/summaryApi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Folder,
  LogOut,
  Loader2,
  Users,
  ShieldCheck,
  Zap,
  Save,
  Edit3,
  EyeOff,
  Eye,
  Copy,
  Check,
  Key,
  Laptop,
  Lock,
} from "lucide-react";
import { tokenValues, logoutUser } from "../storeSlices/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function SecurityCenter({
  intervalMs = 1000,
  initialToken = "",
}) {
  const [tab, setTab] = useState("pending");
  const [pendingDevices, setPendingDevices] = useState([]);
  const [approvedDevices, setApprovedDevices] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [tokenCode, setTokenCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const pollRef = useRef(null);
  const mountedRef = useRef(true);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [originalToken, setOriginalToken] = useState(initialToken);
  const baseButtonClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token_code } = useSelector((state) => state.user);
  const userData = JSON.parse(localStorage.getItem("userData"));

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [generatedLogId, setGeneratedLogId] = useState("");
  const smallLoader = <Loader2 className="animate-spin w-4 h-4" />;

  const safeFetch = async (fn) => {
    try {
      return await fn();
    } catch (err) {
      return null;
    }
  };
  const handlePasswordFormChange = useCallback((field, value) => {
    setPasswordForm((prevForm) => ({
      ...prevForm,
      [field]: value,
    }));
  }, []);
  function generateTokenLog() {
    const userDataString = localStorage.getItem("userData");

    if (!userDataString) {
      console.error("User data not found in localStorage.");
      return null;
    }

    let userData;
    try {
      userData = JSON.parse(userDataString);
    } catch (e) {
      console.error("Failed to parse user data from localStorage:", e);
      return null;
    }

    const { _id, email, username } = userData;

    if (!_id || !email || !username) {
      console.error(
        "Required fields (_id, email, username) are missing in user data."
      );
      return null;
    }

    const idStart = _id.slice(0, 4);
    const idEnd = _id.slice(-4);

    const emailPrefixMatch = email.match(/^([^@]+)/);
    const emailPart = emailPrefixMatch ? emailPrefixMatch[1].slice(0, 4) : "";

    const usernamePart = username.split(" ").join("").slice(0, 4);

    const TimePart = new Date().toTimeString().split(":").join("").slice(2, 6);

    const logIdentifier = `${idStart}-${idEnd}-${emailPart}-${usernamePart}-${TimePart}`;

    const joinToken = logIdentifier.split("-").join("");

    return {
      joinToken,
      logIdentifier,
    };
  }

  const fetchPending = async () => {
    const res = await safeFetch(() =>
      Axios({ ...SummaryApi.GetPendingDevice })
    );
    if (res?.data?.success) setPendingDevices(res.data.data || []);
    else if (res && !res.data?.success) setPendingDevices([]);
  };

  const fetchApproved = async () => {
    const res = await safeFetch(() =>
      Axios({ ...SummaryApi.GetApprovedDevice })
    );
    if (res?.data?.success) setApprovedDevices(res.data.data || []);
    else if (res && !res.data?.success) setApprovedDevices([]);
  };

  const fetchFolders = async () => {
    const res = await safeFetch(() => Axios({ ...SummaryApi.getFolders }));
    if (res?.data?.success) setFolders(res.data.data || []);
  };

  const fetchSelectedFolders = async () => {
    const res = await safeFetch(() =>
      Axios({ ...SummaryApi.getSelectedFolders })
    );
    if (res?.data?.success) setSelectedFolders(res.data.folderIds || []);
  };

  const handleApproveReject = async (id, action) => {
    const confirm = await Swal.fire({
      title: `${action === "approve" ? "Approve" : "Reject"} device?`,
      text:
        action === "approve"
          ? "This will grant access to the device."
          : "This will remove the pending device request.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: action === "approve" ? "Yes, approve" : "Yes, reject",
      confirmButtonColor: action === "approve" ? "#10B981" : "#EF4444",
    });
    if (!confirm.isConfirmed) return;

    setBusyAction(id);
    try {
      await Axios({
        ...SummaryApi.UpdateDevicesStatus(id),
        data: { action },
      });

      toast.success(
        `Device ${action === "approve" ? "approved" : "rejected"} successfully`
      );

      if (action === "approve") {
        setPendingDevices((p) => p.filter((d) => d._id !== id));
        await fetchApproved();
      } else {
        setPendingDevices((p) => p.filter((d) => d._id !== id));
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Action failed. Try again.", "error");
    } finally {
      setBusyAction(null);
    }
  };

  const handleForceLogout = async (deviceId) => {
    const confirm = await Swal.fire({
      title: "Force logout device?",
      text: "This immediately revokes the device's access.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      confirmButtonColor: "#EF4444",
    });
    if (!confirm.isConfirmed) return;

    setBusyAction(deviceId);
    try {
      await Axios({ ...SummaryApi.ForceLogout(deviceId) });
      toast.success("Device logged out successfully");
      await fetchApproved();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Force logout failed", "error");
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggleFolder = async (folderId) => {
    let updated = selectedFolders.includes(folderId)
      ? selectedFolders.filter((f) => f !== folderId)
      : [...selectedFolders, folderId];

    setSelectedFolders(updated);

    try {
      const res = await Axios({
        ...SummaryApi.selectFolders,
        data: { folderIds: updated },
      });
      if (!res?.data?.success) throw new Error(res?.data?.message || "Failed");
      toast.success("Folder selection updated");
    } catch (err) {
      console.error("update folder error", err);
      toast.error("Failed to update selection, reverting");
      await fetchSelectedFolders();
    }
  };

  const handleSelectAll = async () => {
    const allIds = folders.map((f) => f._id);
    const target = allIds.length === selectedFolders.length ? [] : allIds;
    setSelectedFolders(target);
    try {
      const res = await Axios({
        ...SummaryApi.selectFolders,
        data: { folderIds: target },
      });
      if (!res?.data?.success) throw new Error(res?.data?.message || "Failed");
      toast.success(target.length ? "All selected" : "Unselected all");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update selection");
      await fetchSelectedFolders();
    }
  };

  const handleNewSaveToken = async () => {
    setLoading(true);

    const { joinToken: newTokenValue, logIdentifier: newLogId } =
      generateTokenLog();

    try {
      const { data } = await Axios({
        ...SummaryApi.saveTokenCode,
        data: { token: newTokenValue, regenerate: true },
      });

      if (data?.success) {
        toast.success("New Token Generated and Saved successfully.");

        setTokenCode(newLogId);
        setGeneratedLogId(newLogId);

        await fetchToken();
      } else {
        toast.error(data?.message || "Failed to generate new token.");
      }
    } catch (error) {
      console.error("Regeneration Error:", error);
      toast.error("An unexpected error occurred during token generation.");
    } finally {
      setLoading(false);
    }
  };

  const fetchToken = async (attemptInitialGeneration = false) => {
    setLoading(true);
    try {
      const response = await Axios({
        ...SummaryApi.getTokenCode,
      });

      let currentToken = response?.data?.data;

      if (!currentToken && attemptInitialGeneration) {
        console.log("No existing token found. Generating initial token...");

        const { joinToken: initialTokenValue, logIdentifier: initialLogId } =
          generateTokenLog();

        const generateResponse = await Axios({
          ...SummaryApi.saveTokenCode,
          data: { token: initialTokenValue, isInitial: true },
        });

        currentToken = generateResponse?.data?.data;
        setGeneratedLogId(initialLogId);

        if (!currentToken) {
          toast.error("Failed to generate initial API token.");
        }
      }

      if (currentToken) {
        const logIdForDisplay = currentToken.match(/.{1,4}/g).join("-");

        localStorage.setItem(`token_code_${userData.email}`, currentToken);
        setTokenCode(logIdForDisplay);

        dispatch(
          tokenValues({
            token_code: currentToken,
            email: userData.email,
          })
        );
      }
    } catch (error) {
      console.error("Token Fetch/Generation Error:", error);
      toast.error("Error fetching or generating token.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (!tokenCode) {
      toast.error("No token available to copy.");
      return;
    }

    navigator.clipboard
      .writeText(tokenCode)
      .then(() => {
        setCopied(true);
        toast.success("API Token copied to clipboard!");

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy token:", err);
        toast.error("Failed to copy. Please try manually.");
      });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation password do not match.");
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      setPasswordLoading(false);
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password cannot be the same as the current password.");
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await Axios({
        ...SummaryApi.changePassword,
        data: { currentPassword, newPassword },
      });

      if (res.data?.success) {
        toast.success(
          res.data.message ||
            "Password changed successfully. You will be logged out now."
        );

        setPasswordLoading(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setTimeout(() => {
          dispatch(logoutUser());
          localStorage.clear();
          navigate("/");
        }, 2000);

        return;
      } else {
        toast.error(
          res.data?.message ||
            "Failed to change password. Check your current password."
        );
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        "An unexpected server error occurred.";
      toast.error(errorMessage);
    }
    setPasswordLoading(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };
  const storedToken = localStorage.getItem(`token_code_${userData?.email}`);
  useEffect(() => {
    if (storedToken) {
      const logIdForDisplay = storedToken.match(/.{1,4}/g).join("-");
      setTokenCode(logIdForDisplay);
    }
    fetchToken(true);
  }, []);
  useEffect(() => {
    mountedRef.current = true;

    setLoading(true);
    const storedToken = localStorage.getItem(`token_code_${userData.email}`);

    const mandatoryPromises = [
      fetchPending(),
      fetchApproved(),
      fetchFolders(),
      fetchSelectedFolders(),
    ];

    Promise.all([...mandatoryPromises]).finally(() => setLoading(false));

    pollRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      fetchPending();
      fetchApproved();
      fetchSelectedFolders();
    }, Math.max(500, intervalMs));

    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
    };
  }, [intervalMs, isEditing]);

  const pendingCount = pendingDevices.length;
  const approvedCount = approvedDevices.length;
  const folderCount = folders.length;

  const TabButton = ({ id, label, badge, icon: Icon }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
        tab === id
          ? "bg-orange-500 text-white shadow"
          : "bg-white text-gray-700 border border-gray-200 hover:shadow-sm"
      } flex-shrink-0`}
    >
      {Icon && <Icon size={16} />}
      <span>{label}</span>
      {badge ? (
        <span className="ml-1 bg-white/20 px-2 py-0.5 rounded text-xs">
          {badge}
        </span>
      ) : null}
    </button>
  );

  const theme = localStorage.getItem("theme");
  const isDark = theme === "dark";
  return (
    <div
      className={`${
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      } p-4 sm:p-6 min-h-screen`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1
              className={`${
                isDark ? "text-gray-100" : "text-gray-800"
              } text-2xl font-bold flex items-center gap-3`}
            >
              <ShieldCheck className="text-orange-500" />
              Security Center
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage device approvals, active sessions and folder sharing.
            </p>
          </div>
          <div className="flex flex-wrap justify-start sm:justify-end items-center gap-2 mt-4 sm:mt-0">
            <TabButton
              id="pending"
              label="Pending"
              badge={pendingCount || null}
              icon={Users}
            />
            <TabButton
              id="approved"
              label="Approved"
              badge={approvedCount || null}
              icon={CheckCircle}
            />
            <TabButton
              id="folders"
              label="Folders"
              badge={folderCount || null}
              icon={Folder}
            />
            <TabButton id="token" label="Token" icon={Zap} />
            <TabButton id="password" label="Password" icon={Lock} />
            <button
              onClick={() => {
                setLoading(true);
                Promise.all([
                  fetchPending(),
                  fetchApproved(),
                  fetchFolders(),
                  fetchSelectedFolders(),
                  fetchToken(),
                ]).finally(() => setLoading(false));
                toast.info("Refreshing...");
              }}
              className={`px-3 py-2 rounded-lg border hover:shadow-sm flex-shrink-0 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className={`${
            isDark ? "bg-gray-800 shadow-xl" : "bg-white shadow"
          } rounded-2xl p-5`}
        >
          <AnimatePresence mode="wait">
            {tab === "pending" && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <h3
                  className={`${
                    isDark ? "text-gray-100" : "text-gray-900"
                  } text-lg font-semibold mb-4 flex items-center gap-2`}
                >
                  <Users size={18} /> Pending Device Requests
                </h3>

                {loading ? (
                  <div className="py-10 flex items-center justify-center text-gray-500 gap-2">
                    {smallLoader} Loading...
                  </div>
                ) : pendingDevices.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    No pending devices
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {pendingDevices.map((d) => (
                      <div
                        key={d._id}
                        className={`p-4 rounded-lg border flex flex-col justify-between ${
                          isDark
                            ? "bg-gray-900 border-gray-700"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`${
                                isDark ? "text-gray-100" : "text-gray-800"
                              } font-semibold truncate`}
                            >
                              {d?.LoginUser?.username ||
                                d?.linkedUser?.username ||
                                "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {d?.LoginUser?.email || d?.linkedUser?.email}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              Device:{" "}
                              <span className="text-sm">
                                {d.deviceName || "Unknown"}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Requested:{" "}
                              {new Date(d.requestedAt).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              IP: {d.ip || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            disabled={busyAction === d._id}
                            onClick={() =>
                              handleApproveReject(d._id, "approve")
                            }
                            className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {busyAction === d._id ? (
                              smallLoader
                            ) : (
                              <CheckCircle size={18} />
                            )}{" "}
                            Approve
                          </button>
                          <button
                            disabled={busyAction === d._id}
                            onClick={() => handleApproveReject(d._id, "reject")}
                            className="flex-1 bg-red-500 text-white py-2 rounded-md hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {busyAction === d._id ? (
                              smallLoader
                            ) : (
                              <XCircle size={18} />
                            )}{" "}
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "approved" && (
              <motion.div
                key="approved"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <h3
                  className={`${
                    isDark ? "text-gray-100" : "text-gray-900"
                  } text-lg font-semibold mb-4 flex items-center gap-2`}
                >
                  <CheckCircle size={18} /> Approved Devices
                </h3>

                {loading ? (
                  <div className="py-10 flex items-center justify-center text-gray-500 gap-2">
                    {smallLoader} Loading...
                  </div>
                ) : approvedDevices.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    No active devices
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {approvedDevices.map((d) => (
                      <div
                        key={d._id}
                        className={`p-4 rounded-lg border flex flex-col justify-between ${
                          isDark
                            ? "bg-gray-900 border-gray-700"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div>
                          <p
                            className={`${
                              isDark ? "text-gray-100" : "text-gray-800"
                            } font-semibold`}
                          >
                            {d?.LoginUser?.username ||
                              d?.linkedUser?.username ||
                              "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {d?.LoginUser?.email || d?.linkedUser?.email}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Device: {d.deviceName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Approved At:{" "}
                            {new Date(d.approvedAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => handleForceLogout(d._id)}
                            disabled={busyAction === d._id}
                            className="flex-1 bg-red-500 text-white py-2 rounded-md hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {busyAction === d._id ? (
                              smallLoader
                            ) : (
                              <LogOut size={18} />
                            )}{" "}
                            Force Logout
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "folders" && (
              <motion.div
                key="folders"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`${
                      isDark ? "text-gray-100" : "text-gray-900"
                    } text-lg font-semibold flex items-center gap-2`}
                  >
                    <Folder /> Folder Sharing
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className={`px-3 py-1 rounded border text-sm ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                          : "bg-white border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      {selectedFolders.length === folders.length
                        ? "Unselect All"
                        : "Select All"}
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {folders.map((f) => {
                    const isSelected = selectedFolders.includes(f._id);
                    return (
                      <motion.div
                        key={f._id}
                        layout
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          isSelected
                            ? isDark
                              ? "bg-orange-500/20 border-orange-500 text-white"
                              : "bg-orange-100 border-orange-400 text-gray-800"
                            : isDark
                            ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                            : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`${
                                isDark ? "text-gray-100" : "text-gray-800"
                              } font-semibold truncate`}
                            >
                              {f.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {f.files?.length || 0} files
                            </p>
                          </div>
                          <div>
                            <button
                              onClick={() => handleToggleFolder(f._id)}
                              className={`px-3 py-1 rounded ${
                                isSelected
                                  ? "bg-orange-500 text-white hover:bg-orange-600"
                                  : isDark
                                  ? "bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700"
                                  : "bg-white border text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {tab === "token" && (
              <motion.div
                key="token"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="px-2 sm:px-6 max-w-3xl mx-auto py-8"
              >
                {/* Header and Instructions */}
                <header>
                  <h3
                    className={`${
                      isDark ? "text-gray-100" : "text-gray-900"
                    } text-2xl font-extrabold mb-2 flex items-center gap-3`}
                  >
                    <Zap size={24} className="text-orange-600" /> API Token
                    Management
                  </h3>
                  <p className="text-gray-500 mb-8 text-sm sm:text-base">
                    Your secure API token facilitates external connections. To
                    maintain integrity, **regenerate** your token when necessary
                    to ensure your systems remain secure.
                  </p>
                </header>

                {/* MAIN TOKEN CARD */}
                <div
                  className={`${
                    isDark
                      ? "bg-gray-900 shadow-2xl border-gray-700"
                      : "bg-white shadow-xl border-gray-100"
                  } rounded-2xl p-6 sm:p-8 border relative overflow-hidden transition-all duration-300 hover:shadow-orange-200/50`}
                >
                  {/* Background elements (omitted for brevity) */}
                  <motion.div /* ... ShieldCheck ... */ />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

                  {/* TOKEN INPUT AREA */}
                  <div className="space-y-4 relative z-10">
                    {/* 2. SECURE TOKEN DISPLAY */}
                    <label
                      className={`${
                        isDark ? "text-gray-300" : "text-gray-700"
                      } text-sm font-semibold block`}
                    >
                      Your Secure Token (JWT)
                    </label>
                    {/* Input and Internal Buttons Container */}
                    <div className="relative flex items-center">
                      <input
                        type={showToken ? "text" : "password"}
                        value={tokenCode}
                        readOnly={true}
                        placeholder={
                          tokenCode
                            ? "Token is active..."
                            : "No token found. Click Regenerate to create one."
                        }
                        className={`
      w-full py-3 sm:py-4 pl-4 
      
      // 💡 KEY FIX: Allow horizontal scrolling and prevent wrap
      overflow-x-auto whitespace-nowrap overflow-y-hidden 
      
      // Adjusted padding for button group visibility
      pr-24 sm:pr-28 
      
      text-sm font-mono rounded-xl transition-all duration-200
      cursor-text // Allow cursor to show interaction
      ${
        isDark
          ? "bg-gray-700 border border-gray-600 text-gray-200"
          : "bg-gray-50 border border-gray-300 text-gray-700"
      }
    `}
                      />

                      {/* The button container ensures buttons are always on the right */}
                      <div className="absolute right-2 flex items-center space-x-1">
                        {tokenCode && (
                          <button
                            type="button"
                            onClick={() => setShowToken((p) => !p)}
                            title={showToken ? "Hide Token" : "Show Token"}
                            className="p-1.5 sm:p-2 text-gray-500 hover:text-orange-500 transition-colors rounded-full"
                          >
                            {showToken ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        )}

                        {tokenCode && (
                          <button
                            type="button"
                            onClick={handleCopyToken}
                            title="Copy Token"
                            className={`p-1.5 sm:p-2 transition-colors rounded-full ${
                              copied
                                ? "text-green-500"
                                : "text-gray-500 hover:text-blue-500"
                            }`}
                          >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex lg:ms-[450px]
                    "
                    >
                      <button
                        type="button"
                        onClick={handleNewSaveToken}
                        disabled={loading}
                        className={`

    flex w-fit space-x-2 px-4 py-2 rounded-lg 
    font-bold text-xs shadow-md transition-all duration-300
    ${
      loading
        ? "bg-gray-400 text-gray-700 cursor-not-allowed shadow-none"
        : // 💡 Smart Color: High-trust Blue Gradient
          "bg-gradient-to-r  from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/50 hover:shadow-blue-500/70 text-white"
    }
  `}
                      >
                        {/* Content based on State (Loading vs. Token Exists vs. No Token) */}
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin w-4 h-4" />
                            <span>Generating...</span>
                          </>
                        ) : tokenCode ? (
                          <>
                            <Edit3 size={16} /> {/* Smaller icon size */}
                            <span>Regenerate **(Security)**</span>
                          </>
                        ) : (
                          <>
                            <Zap size={16} /> {/* Smaller icon size */}
                            <span>Generate Token</span>
                          </>
                        )}
                      </button>
                    </div>
                    {/* 3. GENERATED UNIQUE LOG ID DISPLAY (Smart, attractive addition) */}
                    {generatedLogId && (
                      <div
                        className={`${
                          isDark ? "text-gray-400" : "text-gray-600"
                        } text-xs pt-1`}
                      >
                        {generatedLogId && (
                          <p className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            **Log ID:**{" "}
                            <code className="text-orange-500 bg-orange-500/10 p-1 rounded font-mono text-[10px] sm:text-xs">
                              {generatedLogId}
                            </code>
                          </p>
                        )}
                      </div>
                    )}
                    {/* SMARTER STATUS MESSAGE (Updated to reflect new logic) */}
                    <div
                      className={`${
                        isDark ? "border-gray-700" : "border-gray-100"
                      } mt-4 pt-2 border-t flex items-center text-sm font-medium`}
                    >
                      {loading ? (
                        <span className="text-blue-500 flex items-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4" /> **Syncing
                          changes...**
                        </span>
                      ) : tokenCode ? (
                        <span className="text-green-500 flex items-center gap-2">
                          <CheckCircle size={16} /> **Token is active** and
                          secured.
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-2">
                          <XCircle size={16} /> **Token missing.** Please
                          regenerate.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {tab === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="px-2 sm:px-6 max-w-lg mx-auto py-8"
              >
                <header>
                  <h3
                    className={`${
                      isDark ? "text-gray-100" : "text-gray-900"
                    } text-2xl font-extrabold mb-2 flex items-center gap-3`}
                  >
                    <Lock size={24} className="text-red-500" /> Change Password
                  </h3>
                  <p className="text-gray-500 mb-8 text-sm sm:text-base">
                    Update your account password. For security, you will be
                    **logged out** immediately upon a successful change.
                  </p>
                </header>

                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="relative">
                    <label
                      htmlFor="currentPassword"
                      className={`${
                        isDark ? "text-gray-300" : "text-gray-700"
                      } text-sm font-semibold block mb-1`}
                    >
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      type={showCurrentPass ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        handlePasswordFormChange(
                          "currentPassword",
                          e.target.value
                        )
                      }
                      required
                      className={`w-full p-3 pr-10 rounded-lg border focus:ring-2 focus:ring-orange-500 transition-colors ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      {showCurrentPass ? (
                        <Eye size={18} />
                      ) : (
                        <EyeOff size={18} />
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <label
                      htmlFor="newPassword"
                      className={`${
                        isDark ? "text-gray-300" : "text-gray-700"
                      } text-sm font-semibold block mb-1`}
                    >
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type={showNewPass ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        handlePasswordFormChange("newPassword", e.target.value)
                      }
                      required
                      className={`w-full p-3 pr-10 rounded-lg border focus:ring-2 focus:ring-orange-500 transition-colors ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      {showNewPass ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  <div className="relative">
                    <label
                      htmlFor="confirmPassword"
                      className={`${
                        isDark ? "text-gray-300" : "text-gray-700"
                      } text-sm font-semibold block mb-1`}
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type={showNewPass ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        handlePasswordFormChange(
                          "confirmPassword",
                          e.target.value
                        )
                      }
                      required
                      className={`w-full p-3 pr-10 rounded-lg border focus:ring-2 focus:ring-orange-500 transition-colors ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      {showNewPass ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      passwordLoading ||
                      !passwordForm.currentPassword ||
                      !passwordForm.newPassword ||
                      !passwordForm.confirmPassword
                    }
                    className={`w-full ${baseButtonClasses} py-3 text-lg transition-all mt-8 ${
                      passwordLoading
                        ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5 mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={20} className="mr-2" /> Change Password
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
