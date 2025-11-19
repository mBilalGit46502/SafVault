import React, { useState } from "react";
import { X } from "lucide-react";
import Axios from "../api/Axios";
import { toast } from "react-toastify";
import SummaryApi from "../api/summaryApi";
import { createFolder } from "../storeSlices/folderSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

function FolderInput({ onClose }) {
  const [folderName, setFolderName] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const theme = localStorage.getItem("theme");
  const isDark = theme === "dark";

  const handleCreate = async () => {
    if (!folderName.trim()) return toast.error("Enter a folder name!");

    try {
      const { data } = await Axios({
        ...SummaryApi.createFolder,
        data: { folderName },
      });

      if (data?.success) {
        dispatch(createFolder(data?.data)); // ✅ only push folder object
        toast.success(data?.message);
        navigate("/folder");
        onClose();
        // window.location.reload() // Removed as state management handles update
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Internal server error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div
        className={`${
          isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
        } p-6 rounded-2xl shadow-lg w-[90%] max-w-sm relative transition-colors duration-300`}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-red-500 transition-colors"
        >
          <X size={20} />
        </button>

        <h3
          className={`text-lg font-semibold mb-4 ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          Create New Folder
        </h3>

        <input
          type="text"
          placeholder="Enter folder name..."
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className={`w-full border rounded-md px-3 py-2 mb-4 focus:ring-2 focus:ring-orange-400 outline-none transition-colors duration-300 ${
            isDark
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
          }`}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          autoFocus
        />

        <button
          onClick={handleCreate}
          className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition"
        >
          Create
        </button>
      </div>
    </div>
  );
}

export default FolderInput;
