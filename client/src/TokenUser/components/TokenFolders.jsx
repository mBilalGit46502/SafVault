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
import SummaryApi from "../../api/SummaryApi";

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
    const blockScreenshots = (e) => {
      if (previewFile) {
        e.preventDefault();
        toast.warn("Screenshot blocked for security");
        return false;
      }
    };

    const blockKeys = (e) => {
      if (previewFile) {
        // Block PrintScreen, F12, Ctrl+Shift+I, etc.
        if (
          e.keyCode === 44 || // PrintScreen
          e.keyCode === 123 || // F12
          (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
          (e.ctrlKey && e.shiftKey && e.keyCode === 67) || // Ctrl+Shift+C
          (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
          (e.ctrlKey && e.keyCode === 83) // Ctrl+S
        ) {
          e.preventDefault();
          return false;
        }
      }
    };

    document.addEventListener("keyup", blockKeys);
    document.addEventListener("keydown", blockKeys);
    window.addEventListener("beforeprint", blockScreenshots);

    return () => {
      document.removeEventListener("keyup", blockKeys);
      document.removeEventListener("keydown", blockKeys);
      window.removeEventListener("beforeprint", blockScreenshots);
    };
  }, [previewFile]);

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
                    {file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <Image className="text-blue-500" size={20} />
                    ) : file.name.match(/\.pdf$/i) ? (
                      <FileText className="text-red-500" size={20} />
                    ) : (
                      <File className="text-gray-400" size={20} />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">{file.createdAt}</p>
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

      <AnimatePresence>
        {previewFile && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              className="relative w-full h-full max-w-5xl max-h-screen rounded-2xl overflow-hidden"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
                <h3 className="text-white text-lg font-medium truncate max-w-md">
                  {previewFile.name}
                </h3>
                <div className="flex items-center gap-4">
                  {currentFolder && (
                    <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-white text-sm">
                      {index + 1} / {currentFolder.files.length}
                    </span>
                  )}
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition"
                  >
                    <X size={28} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Navigation */}
              {currentFolder && currentFolder.files.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevFile();
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-40 p-4 bg-black/60 hover:bg-black/80 rounded-full transition"
                  >
                    <ChevronLeft size={40} className="text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextFile();
                    }}
                    className="absolute  right-0 top-1/2 -translate-y-1/2 z-40 p-4 bg-black/60 hover:bg-black/80 rounded-full transition"
                  >
                    <ChevronRight size={40} className="text-white" />
                  </button>
                </>
              )}

              {/* CONTENT */}
              <div className="h-full flex items-center justify-center pt-20 pb-10  overflow-auto">
                {previewFile.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-full  object-contain rounded-xl shadow-2xl"
                    draggable={false}
                  />
                ) : previewFile.name.match(/\.pdf$/i) ? (
                  /* 100% CLEAN PDF - TOOLBAR GONE FOREVER */
                  <iframe
                    src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
                      previewFile.url
                    )}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&pagemode=none`}
                    className="w-full h-full min-h-screen rounded-xl border-0 shadow-2xl"
                    title="Document"
                    allowFullScreen
                    style={{
                      background: "transparent",
                      pointerEvents: "auto",
                    }}
                    sandbox="allow-scripts allow-same-origin"
                    // THIS LINE REMOVES TOOLBAR EVEN IF PDF.js TRIES TO SHOW IT
                    onLoad={(e) => {
                      const iframe = e.target;
                      const hideToolbar = () => {
                        try {
                          const doc =
                            iframe.contentDocument ||
                            iframe.contentWindow.document;
                          // Hide all possible toolbars
                          const toolbars = doc.querySelectorAll(
                            "#toolbar, .toolbar, #secondaryToolbar, .secondaryToolbar"
                          );
                          toolbars.forEach(
                            (el) => el && (el.style.display = "none")
                          );
                          // Hide header
                          const header = doc.querySelector("#header, .header");
                          if (header) header.style.display = "none";
                          // Hide outer container margin
                          const outer = doc.querySelector("#outerContainer");
                          if (outer) outer.style.top = "0";
                        } catch (err) {}
                      };
                      // Run multiple times to catch late loading
                      hideToolbar();
                      setTimeout(hideToolbar, 100);
                      setTimeout(hideToolbar, 500);
                      setTimeout(hideToolbar, 1000);
                    }}
                  />
                ) : (
                  <div className="text-white/70 text-center">
                    <File size={80} />
                    <p className="mt-6 text-xl">Preview not available</p>
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
