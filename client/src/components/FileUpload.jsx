import React, { useState, useEffect } from "react";
import { Upload, FileText, FileUp, X, Moon, Sun } from "lucide-react";
import Axios from "../api/Axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import SummaryApi from "../api/SummaryApi";

/* ───────── helper ───────── */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
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

  const MAX_SIZE = 50 * 1024 * 1024; // 50MB

  const handleThemeToggle = () =>
    setTheme((p) => (p === "light" ? "dark" : "light"));

  /* ───────── select files ───────── */
  const handleFilesSelect = (filesArray) => {
    const files = Array.from(filesArray);

    const validFiles = files.filter((file) => {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 50MB limit`);
        return false;
      }
      return true;
    });

    const map = new Map(
      validFiles.map((file) => [
        file.name + file.size + file.lastModified,
        file,
      ])
    );

    setSelectedFiles((prev) => new Map([...prev, ...map]));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = (key) => {
    setSelectedFiles((prev) => {
      const map = new Map(prev);
      map.delete(key);
      return map;
    });
    setProgress(0);
  };

  /* ───────── upload logic (FIXED) ───────── */
  const handleUpload = async () => {
    if (selectedFiles.size === 0) return toast.error("No files selected");
    if (isUploading) return;

    setIsUploading(true);
    let success = 0;

    for (const file of selectedFiles.values()) {
      const uniqueKey = file.name + file.size + file.lastModified;

      // 🔥 sanitize filename (FIX & ISSUE)
      const safeFile = new File(
        [file],
        file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
        { type: file.type }
      );

      const formData = new FormData();
      formData.append("file", safeFile);

      try {
        const { data } = await Axios({
          ...SummaryApi.uploadFileOnFolder(folderId),
          data: formData,
          // ❌ DO NOT SET Content-Type
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / e.total);
            setProgress(percent);
          },
        });

        if (data?.success) {
          success++;
          setFiles((prev) => [data.data, ...prev]);

          setSelectedFiles((prev) => {
            const map = new Map(prev);
            map.delete(uniqueKey);
            return map;
          });

          setProgress(0);
        }
      } catch (err) {
        console.error(err);
        toast.error(`Upload failed: ${file.name}`);
        setProgress(0);
      }
    }

    toast.success(`${success} file(s) uploaded`);
    setIsUploading(false);
  };

  /* ───────── cleanup image previews ───────── */
  useEffect(() => {
    const urls = [];
    selectedFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        urls.push(URL.createObjectURL(file));
      }
    });
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [selectedFiles]);

  /* ───────── UI ───────── */
  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-6">
      {/* header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Upload size={20} /> Upload Files
        </h3>
        <button onClick={handleThemeToggle}>
          {theme === "light" ? <Moon /> : <Sun />}
        </button>
      </div>

      {/* select */}
      {uploadType === "button" ? (
        <div className="border-2 border-dashed p-6 text-center rounded-xl">
          <input
            type="file"
            multiple
            hidden
            id="fileInput"
            onChange={(e) => handleFilesSelect(e.target.files)}
          />
          <label htmlFor="fileInput" className="cursor-pointer">
            <FileUp size={32} />
            <p>Select files</p>
          </label>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed p-6 text-center rounded-xl"
        >
          Drag files here
        </div>
      )}

      {/* preview */}
      {selectedFiles.size > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5 space-y-3"
        >
          {Array.from(selectedFiles.entries()).map(([key, file]) => (
            <div
              key={key}
              className="flex justify-between items-center bg-gray-100 p-2 rounded"
            >
              <span className="text-sm truncate">
                {file.name} ({formatBytes(file.size)})
              </span>
              <button onClick={() => handleRemoveFile(key)}>
                <X size={14} />
              </button>
            </div>
          ))}

          {progress > 0 && (
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className="bg-green-600 h-2 rounded"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-green-600 text-white py-2 rounded-lg"
          >
            {isUploading ? `Uploading ${progress}%` : "Start Upload"}
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default FileUpload;
