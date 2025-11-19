import React, { useRef, useState } from "react"; // Removed useEffect
import { toast } from "react-toastify";
import { noImage } from "../assets";
import Axios from "../api/Axios";
import SummaryApi from "../api/summaryApi";
import Loader from "../utils/Loader";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser, logoutUser } from "../storeSlices/userSlice";
import { ArrowRight, Lock, LogOut, ShieldCheck } from "lucide-react";

function ProfileDetail({ user, onClose, popupRef }) {
  const [preview, setPreview] = useState(user?.avatar || null);
  const [loader, setLoader] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const theme = localStorage.getItem("theme");
  const isDark = theme === "dark";

  const handleLabelClick = (e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoader(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const { data } = await Axios({
        ...SummaryApi.update_avatar,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const user = JSON.parse(localStorage.getItem("userData"));

      if (data?.success) {
        const existingUser = JSON.parse(localStorage.getItem("userData"));
        const existingToken = localStorage.getItem("accessToken");
        console.log("existingToken", existingToken);

        const updatedUser = {
          ...existingUser,
          avatar: data?.data?.avatar, // update only avatar
        };

        localStorage.setItem("userData", JSON.stringify(updatedUser));
        localStorage.setItem("accessToken", existingToken || updatedUser.token); // ✅ preserve token

        dispatch(loginUser(updatedUser));
        setPreview(updatedUser?.avatar);
        onClose();
        toast.success("Profile image updated!");
      } else {
        toast.error(data?.message || "Failed to update avatar");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Upload failed");
    } finally {
      setLoader(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await Axios({ ...SummaryApi.logout });
      if (res?.data?.error) return toast.error(res?.data?.message);

      if (res?.data?.success) {
        toast.success(res?.data?.message);

        dispatch(logoutUser());
        localStorage.clear();

        onClose();
        navigate("/");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.error || error?.message || "Failed to logout"
      );
    }
  };

  return (
    <div
      ref={popupRef}
      className={`absolute top-[85px] right-4 z-50 w-[260px] rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 ${
        isDark
          ? "bg-gray-800 text-gray-100 border border-gray-700"
          : "bg-white text-gray-800 border border-gray-100"
      }`}
    >
      {/* Header */}
      <div
        className={`flex justify-between items-center px-4 py-3 border-b transition-colors duration-300 ${
          isDark
            ? "bg-gray-700 border-gray-600 text-white"
            : "bg-gray-50 border-gray-100 text-gray-800"
        }`}
      >
        <h3 className="font-semibold text-sm">Your Profile</h3>
        {/* CLOSES THE MODAL */}
        <button onClick={onClose} className="text-gray-500 hover:text-red-500">
          ✕
        </button>
      </div>

      <div className="flex flex-col items-center px-4 py-4">
        <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden border border-gray-300">
          {loader && (
            <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 text-white text-sm">
              <Loader />
            </div>
          )}
          <img
            className="w-full h-full object-cover"
            src={
              user?.avatar?.url
                ? user.avatar.url
                : typeof user?.avatar === "string"
                ? user?.avatar
                : noImage
            }
            alt="User Avatar"
          />
        </div>

        <button
          onClick={handleLabelClick}
          className="text-orange-600 cursor-pointer font-medium hover:underline mt-2"
          disabled={loader}
        >
          Change Image
        </button>

        <input
          type="file"
          ref={fileInputRef}
          id="avatarUpload"
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
        />

        <p
          className={`mt-2 font-semibold ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          {user?.username}
        </p>
        <p className="text-xs text-gray-500">{user?.email}</p>

        <div className="mt-4 w-full space-y-2">
          <button
            onClick={() => {
              navigate("/security-center");
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
              isDark
                ? "bg-orange-800/30 hover:bg-orange-800/50 text-orange-400"
                : "bg-orange-100 hover:bg-orange-200 text-orange-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} /> Security Center
            </span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => {
              navigate("/folder");
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
              isDark
                ? "bg-yellow-800/30 hover:bg-yellow-800/50 text-yellow-400"
                : "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Lock size={16} /> My Folders
            </span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileDetail;
