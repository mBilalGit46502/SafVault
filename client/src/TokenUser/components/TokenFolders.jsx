import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  FolderIcon,
  FileText,
  Image,
  File,
  Loader2,
  Search,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Axios from "../../api/Axios";
import SummaryApi from "../../api/summaryApi";

export default function TokenFolders() {
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [owner, setOwner] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [index, setIndex] = useState(0);

  const fetchFoldersAndFiles = useCallback(async () => {
    try {
      const { data } = await Axios({
        ...SummaryApi.GetUpdateTokenFolder,
      });

      if (data.success) {
        setFolders(data.data || []);
        setOwner(data.linkedOwner || {});
      } else {
        toast.error(data.message || "Failed to load folders");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading token folders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoldersAndFiles();
    const interval = setInterval(fetchFoldersAndFiles, 1000);
    return () => clearInterval(interval);
  }, [fetchFoldersAndFiles]);

  const filteredFolders = useMemo(() => {
    let updated = folders.map((folder) => ({
      ...folder,
      files: folder.files.filter((f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }));

    if (sortBy === "name") {
      updated = updated.map((f) => ({
        ...f,
        files: [...f.files].sort((a, b) => a.name.localeCompare(b.name)),
      }));
    } else if (sortBy === "date") {
      updated = updated.map((f) => ({
        ...f,
        files: [...f.files].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ),
      }));
    }

    return updated.filter((folder) => folder.files.length > 0);
  }, [folders, searchTerm, sortBy]);

  const openPreview = (folder, fileIndex) => {
    setCurrentFolder(folder);
    setPreviewFile(folder.files[fileIndex]);
    setIndex(fileIndex);
  };

  const nextFile = () => {
    if (currentFolder && index < currentFolder.files.length - 1) {
      const newIndex = index + 1;
      setPreviewFile(currentFolder.files[newIndex]);
      setIndex(newIndex);
    }
  };

  const prevFile = () => {
    if (currentFolder && index > 0) {
      const newIndex = index - 1;
      setPreviewFile(currentFolder.files[newIndex]);
      setIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Loading folders...
      </div>
    );
  }

  if (!folders.length) {
    return (
      <div className="text-center py-10 text-gray-400">
        <FolderIcon className="mx-auto mb-2 text-gray-300" size={36} />
        <p>No shared folders found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Shared Folders
          </h1>
          {owner && (
            <p className="text-sm text-gray-500">
              Shared by{" "}
              <span className="text-orange-500 font-medium">
                {owner.username}
              </span>{" "}
              ({owner.email})
            </p>
          )}
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm"
            />
          </div>
          <button
            onClick={() =>
              setSortBy((prev) => (prev === "name" ? "date" : "name"))
            }
            className="flex items-center gap-2 px-3 py-2 border rounded-xl text-sm hover:bg-orange-50 border-gray-200"
          >
            <ArrowUpDown size={16} /> Sort: {sortBy}
          </button>
        </div>
      </div>

      {/* Folder Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFolders.map((folder) => (
          <motion.div
            key={folder.folderId}
            layout
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
          >
            {/* Folder Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <FolderIcon className="text-orange-500" size={22} />
                <h3 className="font-semibold text-gray-700 truncate">
                  {folder.folderName}
                </h3>
              </div>
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-md">
                {folder.files.length} Files
              </span>
            </div>

            {/* File List */}
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {folder.files.length ? (
                folder.files.map((file, i) => (
                  <motion.div
                    key={file.fileId}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => openPreview(folder, i)}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-orange-50 border border-gray-100 rounded-lg p-2 cursor-pointer transition-all"
                  >
                    {file.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <Image className="text-blue-400" size={20} />
                    ) : file.name.match(/\.pdf$/i) ? (
                      <FileText className="text-red-500" size={20} />
                    ) : (
                      <File className="text-gray-400" size={20} />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(file.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-3">
                  No files in this folder
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-3xl w-full shadow-lg relative overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                onClick={() => setPreviewFile(null)}
                className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full"
              >
                <X size={18} />
              </button>

              <div className="p-5">
                <h2 className="text-lg font-semibold text-gray-700 truncate mb-3">
                  {previewFile.name}
                </h2>

                <div className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {previewFile.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={previewFile.url}
                      alt={previewFile.name}
                      className="max-h-[70vh] object-contain"
                    />
                  ) : previewFile.name.match(/\.pdf$/i) ? (
                    <iframe
                      src={previewFile.url}
                      className="w-full h-[70vh]"
                      title={previewFile.name}
                    />
                  ) : (
                    <div className="p-10 text-gray-400">
                      No preview available for this file type
                    </div>
                  )}
                </div>

                {/* Next/Previous Buttons */}
                {currentFolder && (
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={prevFile}
                      disabled={index === 0}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                        index === 0
                          ? "text-gray-300 bg-gray-100 cursor-not-allowed"
                          : "text-orange-600 bg-orange-50 hover:bg-orange-100"
                      }`}
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>
                    <button
                      onClick={nextFile}
                      disabled={index === currentFolder.files.length - 1}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                        index === currentFolder.files.length - 1
                          ? "text-gray-300 bg-gray-100 cursor-not-allowed"
                          : "text-orange-600 bg-orange-50 hover:bg-orange-100"
                      }`}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
