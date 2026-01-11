import React, { useState, useEffect } from "react";
import { Upload, FileText, FileUp, X, Moon, Sun } from "lucide-react";
import Axios from "../api/Axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import SummaryApi from "../api/SummaryApi";

// Helper function to format file sizes (KB, MB, GB)
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

function FileUpload({ folderId, setFiles }) {
  const [selectedFiles, setSelectedFiles] = useState(new Map());
  const [progress, setProgress] = useState(0);
  const [uploadType, setUploadType] = useState("button");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [theme, setTheme] = useState("light");

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Refined Theme Colors
  const themeColors = {
    light: {
      bgPrimary: "bg-white",
      bgSecondary: "bg-gray-50",
      textPrimary: "text-gray-800",
      textSecondary: "text-gray-500",
      borderColor: "border-gray-200",
      // Brighter Green Upload Button
      uploadButton: "bg-gradient-to-r from-green-600 to-green-700",
      uploadButtonDisabled: "from-gray-400 to-gray-500",
      dragBorder: "border-gray-300 hover:bg-gray-50",
      // Accent color refined for clarity
      activeBorder: "border-indigo-500 bg-indigo-50",
      browseActive: "bg-indigo-500 text-white", // Changed from orange to indigo for accent
      browseInactive: "bg-gray-100 text-gray-600",
    },
    dark: {
      bgPrimary: "bg-gray-900", // Darker primary background
      bgSecondary: "bg-gray-800",
      textPrimary: "text-white",
      textSecondary: "text-gray-400",
      borderColor: "border-gray-700",
      // Bright Teal/Cyan for Dark Mode contrast
      uploadButton: "bg-gradient-to-r from-teal-500 to-cyan-600",
      uploadButtonDisabled: "from-gray-700 to-gray-600",
      dragBorder: "border-gray-700 hover:bg-gray-800",
      // Accent color refined
      activeBorder: "border-fuchsia-400 bg-fuchsia-900/40",
      browseActive: "bg-fuchsia-500 text-white", // Changed to fuchsia for accent
      browseInactive: "bg-gray-700 text-gray-200",
    },
  };
  const T = themeColors[theme];

  // --- File Metrics Calculation ---
  const totalFileSize = Array.from(selectedFiles.values()).reduce(
    (total, file) => total + file.size,
    0
  );

  // --- Utility Functions ---

  const handleFilesSelect = (filesArray) => {
    const files = Array.from(filesArray);
    if (files.length === 0) return;

    const newFilesMap = new Map(
      files.map((file) => [file.name + file.size + file.lastModified, file])
    );

    setSelectedFiles((prev) => new Map([...prev, ...newFilesMap]));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = (uniqueKey) => {
    setSelectedFiles((prev) => {
      const newMap = new Map(prev);
      newMap.delete(uniqueKey);
      return newMap;
    });
    setProgress(0);
    // toast.info("File removed from queue.");
  };

  // --- Main Upload Logic (remains the same) ---
  const handleUpload = async () => {
    if (selectedFiles.size === 0) return toast.error("No files selected!");
    if (isUploading) return;

    setIsUploading(true);
    let uploadedCount = 0;
    const filesToUpload = Array.from(selectedFiles.values());
    const initialTotal = filesToUpload.length;

    for (const file of filesToUpload) {
      const formData = new FormData();
      formData.append("file", file);
      const uniqueKey = file.name + file.size + file.lastModified;

      if (!selectedFiles.has(uniqueKey)) continue;

      try {
        const { data } = await Axios({
          ...SummaryApi.uploadFileOnFolder(folderId),
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / e.total);
            setProgress(percent);
          },
        });

        if (data?.success) {
          uploadedCount++;
          setFiles((prev) => [data.data, ...prev]);

          setSelectedFiles((prevMap) => {
            const newMap = new Map(prevMap);
            newMap.delete(uniqueKey);
            return newMap;
          });
          setProgress(0);
        }
      } catch (err) {
        console.error("Upload failed for:", file.name, err);
        toast.error(`Upload failed for ${file.name}.`);
        setProgress(0);
      }
    }

    toast.success(
      `${uploadedCount}/${initialTotal} file${
        uploadedCount > 1 ? "s" : ""
      } processed!`
    );

    setIsUploading(false);
    setProgress(0);
  };

  useEffect(() => {
    const objectUrls = new Set();
    selectedFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        objectUrls.add(URL.createObjectURL(file));
      }
    });

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  // --- JSX Rendering ---
  return (
    <div
      className={`w-full  max-w-xl mx-auto ${T.bgPrimary} shadow-2xl rounded-2xl p-5 sm:p-6 md:p-8 transition-all duration-300`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3
          className={`font-semibold text-lg flex items-center gap-2 ${T.textPrimary}`}
        >
          <Upload size={20} className="text-indigo-500" />
          Upload Your File
        </h3>

        {/* Theme Toggle & Upload Type Selection */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={handleThemeToggle}
            className={`p-2 rounded-full transition-colors ${T.browseInactive} hover:opacity-80`}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Theme`}
          >
            {theme === "light" ? (
              <Moon size={18} className="text-gray-600" />
            ) : (
              <Sun size={18} className="text-yellow-400" />
            )}
          </button>

          {/* Upload Type Buttons */}
          <button
            className={`px-3 py-1 text-sm rounded-lg border ${
              uploadType === "button" ? T.browseActive : T.browseInactive
            }`}
            onClick={() => setUploadType("button")}
          >
            Browse
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-lg border ${
              uploadType === "dragdrop" ? T.browseActive : T.browseInactive
            }`}
            onClick={() => setUploadType("dragdrop")}
          >
            Drag & Drop
          </button>
        </div>
      </div>

      {/* BROWSE MODE */}
      {uploadType === "button" ? (
        <div
          className={`mt-5 border-2 border-dashed ${T.dragBorder} rounded-xl p-6 text-center transition`}
        >
          <input
            type="file"
            id="fileInput"
            className="hidden"
            multiple
            onChange={(e) => handleFilesSelect(e.target.files)}
            value=""
          />
          <label
            htmlFor="fileInput"
            className={`cursor-pointer flex flex-col items-center ${T.textSecondary} hover:text-indigo-500`}
          >
            <FileUp size={34} />
            <span className="mt-2 text-sm sm:text-base">
              Click to select files (multiple allowed)
            </span>
          </label>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-5 border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            isDragging ? T.activeBorder : T.dragBorder
          }`}
        >
          <p className={`${T.textSecondary} text-sm sm:text-base`}>
            {isDragging ? "Release to upload" : "Drag your files here"}
          </p>
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ FINAL ENHANCED PREVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {selectedFiles.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`mt-6 ${T.borderColor} border rounded-2xl p-5 ${T.bgSecondary} shadow-inner flex flex-col gap-4 transition-colors duration-300`}
        >
          {/* Header & Upload Button */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b ${T.borderColor}`}
          >
            {/* Prominent File Count & Total Size */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
              <div className="flex items-center gap-1">
                <span className={`text-2xl font-extrabold ${T.textPrimary}`}>
                  {selectedFiles.size}
                </span>
                <p className={`text-sm font-medium ${T.textSecondary}`}>
                  file{selectedFiles.size > 1 ? "s" : ""} selected
                </p>
              </div>
              <p
                className={`text-xs font-semibold ${T.textSecondary} opacity-70`}
              >
                ({formatBytes(totalFileSize)} total)
              </p>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              className={`w-full sm:w-auto px-6 py-2 ${T.uploadButton} text-white rounded-xl shadow-lg hover:shadow-xl transition text-base font-semibold disabled:${T.uploadButtonDisabled} disabled:cursor-not-allowed`}
              disabled={isUploading || selectedFiles.size === 0}
            >
              {isUploading
                ? `Uploading... ${progress}%`
                : `Start Upload (${selectedFiles.size})`}
            </button>
          </div>

          {/* HORIZONTAL SCROLLING PREVIEW LIST */}
          <div className="relative">
            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
              <AnimatePresence>
                {Array.from(selectedFiles.entries()).map(
                  ([uniqueKey, file], index) => {
                    const isImage = file.type.startsWith("image/");
                    const fileUrl = isImage ? URL.createObjectURL(file) : null;

                    const style = {
                      transform:
                        index < 3
                          ? `translateX(-${index * 4}px) scale(${
                              1 - index * 0.03
                            })`
                          : "none",
                      zIndex: 100 - index,
                      boxShadow:
                        theme === "dark"
                          ? "0 4px 10px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.05)"
                          : "0 4px 10px rgba(0,0,0,0.1), 0 0 0 2px rgba(255,255,255,0.8)",
                    };

                    return (
                      <motion.div
                        key={uniqueKey}
                        layout
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                        style={style}
                        className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden flex flex-col justify-center items-center text-center p-1 transition-all duration-300 border border-gray-100 ${
                          theme === "dark"
                            ? "bg-gray-800/50 border-gray-600"
                            : "bg-white"
                        }`}
                      >
                        {/* PROMINENT REMOVE BUTTON */}
                        <button
                          onClick={() => handleRemoveFile(uniqueKey)}
                          className="absolute top-1 right-1 p-1 bg-red-500/90 rounded-full text-white hover:bg-red-600 transition-colors z-30 shadow-md"
                          title={`Remove ${file.name} from queue`}
                        >
                          <X size={12} strokeWidth={3} />
                        </button>

                        {isImage && fileUrl ? (
                          <img
                            src={fileUrl}
                            alt={file.name}
                            className="w-full h-full object-cover p-0.5 rounded-lg"
                          />
                        ) : (
                          <>
                            <FileText size={28} className="text-blue-500/80" />
                            <p
                              className={`text-[10px] mt-1 font-medium line-clamp-1 w-full px-1 ${T.textPrimary}`}
                            >
                              {file.name}
                            </p>
                            {/* File Size Display */}
                            <p
                              className={`text-[9px] font-normal ${T.textSecondary} opacity-80`}
                            >
                              {formatBytes(file.size, 1)}
                            </p>
                          </>
                        )}
                      </motion.div>
                    );
                  }
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Progress Bar */}
          {progress > 0 && isUploading && (
            <div className="w-full bg-gray-600/20 rounded-full h-2 overflow-hidden shadow-inner">
              <motion.div
                className="bg-gradient-to-r from-green-400 to-green-600 h-2"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default FileUpload;
