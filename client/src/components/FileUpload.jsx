import React, { useState } from "react";
import { Upload, FileImage, FileText, FileUp } from "lucide-react";
import Axios from "../api/Axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import SummaryApi from "../api/SummaryApi";

function FileUpload({ folderId, setFiles }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadType, setUploadType] = useState("button");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select or drag a file!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await Axios({
        ...SummaryApi.uploadFileOnFolder(folderId),
        data: formData,

        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      if (data?.success) {
        toast.success(" File uploaded successfully!");
        setFiles((prev) => [data.data, ...prev]);
        setFile(null);
        setPreviewUrl(null);
        setProgress(0);
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      toast.error("Upload failed! Please try again.");
    }
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

      {uploadType === "button" ? (
        <div className="mt-5 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition">
          <input
            type="file"
            id="fileInput"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer flex flex-col items-center text-gray-500 hover:text-orange-500"
          >
            <FileUp size={34} />
            <span className="mt-2 text-sm sm:text-base">
              Click to select a file
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
            {isDragging ? "Release to upload your file" : "Drag your file here"}
          </p>
        </div>
      )}

      {previewUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 border rounded-xl p-4 bg-gray-50 flex flex-col items-center gap-3"
        >
          {file?.type.startsWith("image/") ? (
            <img
              src={previewUrl}
              alt="preview"
              loading="eager"
              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg shadow-md"
            />
          ) : file?.type === "application/pdf" ? (
            <div className="flex items-center gap-2 text-red-600 font-medium text-sm sm:text-base">
              <FileText size={24} /> {file.name}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-600 text-sm sm:text-base">
              <FileImage size={24} /> {file.name}
            </div>
          )}

          <button
            onClick={handleUpload}
            className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm sm:text-base"
          >
            Upload Now
          </button>

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
