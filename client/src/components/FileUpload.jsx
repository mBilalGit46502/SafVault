import React, { useState } from "react";
import { Upload, FileImage, FileText, FileUp } from "lucide-react";
import Axios from "../api/Axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import SummaryApi from "../api/SummaryApi";

function FileUpload({ folderId, setFiles }) {
  const [selectedFiles, setSelectedFiles] = useState([]); // All selected files
  const [previewFile, setPreviewFile] = useState(null);   // Only one for preview
  const [previewUrl, setPreviewUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadType, setUploadType] = useState("button");
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection (multiple)
  const handleFilesSelect = (filesArray) => {
    const files = Array.from(filesArray);
    if (files.length === 0) return;

    setSelectedFiles(files);

    // Sirf pehli file ka preview dikhao
    const firstFile = files[0];
    setPreviewFile(firstFile);
    setPreviewUrl(URL.createObjectURL(firstFile));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelect(e.dataTransfer.files);
  };

  // MAIN UPLOAD — SAB FILES EK SAATH UPLOAD + INSTANT SHOW
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return toast.error("No files selected!");

    let uploadedCount = 0;

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const { data }  = await Axios({
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
          // INSTANTLY ADD TO LIST — SAB EK SAATH DIKHEGA
          setFiles((prev) => [data.data, ...prev]);
        }
      } catch (err) {
        console.error("Failed:", file.name);
      }
    }

    // Success + Reset
    toast.success(`${uploadedCount} file${uploadedCount > 1 ? 's' : ''} uploaded!`);
    setSelectedFiles([]);
    setPreviewFile(null);
    setPreviewUrl(null);
    setProgress(0);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-5 sm:p-6 md:p-8 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="font-semibold text-lg text-gray-700 flex items-center gap-2">
          <Upload size={20} className="text-orange-500" />
          Upload Your File
        </h3>

        <div className="flex gap-2">
          <button
            className={`px-3 py-1 text-sm rounded-lg border ${
              uploadType === "button"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
            onClick={() => setUploadType("button")}
          >
            Browse
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-lg border ${
              uploadType === "dragdrop"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
            onClick={() => setUploadType("dragdrop")}
          >
            Drag & Drop
          </button>
        </div>
      </div>

      {/* BROWSE MODE */}
      {uploadType === "button" ? (
        <div className="mt-5 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition">
          <input
            type="file"
            id="fileInput"
            className="hidden"
            multiple
            onChange={(e) => handleFilesSelect(e.target.files)}
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer flex flex-col items-center text-gray-500 hover:text-orange-500"
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
            isDragging
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <p className="text-gray-500 text-sm sm:text-base">
            {isDragging ? "Release to upload" : "Drag your files here"}
          </p>
        </div>
      )}

      {/* PREVIEW — SAME UI + FILE COUNT */}
      {previewUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 border rounded-xl p-4 bg-gray-50 flex flex-col items-center gap-3"
        >
          {/* Main Preview (First File Only) */}
          {previewFile?.type.startsWith("image/") ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="preview"
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg shadow-md"
              />
              {selectedFiles.length > 1 && (
                <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                  +{selectedFiles.length - 1}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-600">
              <FileText size={24} /> {previewFile.name}
              {selectedFiles.length > 1 && (
                <span className="ml-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  +{selectedFiles.length - 1} more
                </span>
              )}
            </div>
          )}

          {/* File Count Text */}
          <p className="text-sm text-gray-600 font-medium">
            {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
          </p>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm sm:text-base font-medium"
          >
            {progress > 0 ? `Uploading... ${progress}%` : "Upload Now"}
          </button>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="w-full mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-green-500 h-2"
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