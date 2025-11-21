import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  Download,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Axios from "../../api/Axios";
import SummaryApi from "../../api/SummaryApi";

// ────────────────────── PDF.js + CACHING SETUP ──────────────────────
import * as pdfjsLib from "pdfjs-dist";
import { get, set } from "idb-keyval";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

// Caching system
const memoryCache = new Map();
const getCacheKey = (url, fileId) =>
  `token_pdf_thumb_${fileId || url.split("/").pop()}`;

const getCachedThumbnail = async (url, fileId) => {
  const key = getCacheKey(url, fileId);
  if (memoryCache.has(key)) return memoryCache.get(key);
  const cached = await get(key).catch(() => null);
  if (cached) memoryCache.set(key, cached);
  return cached;
};

const saveThumbnailToCache = async (url, fileId, dataUrl) => {
  const key = getCacheKey(url, fileId);
  memoryCache.set(key, dataUrl);
  await set(key, dataUrl).catch(() => {});
};

// ────────────────────── PDF THUMBNAIL COMPONENT ──────────────────────
// ────────────────────── PERFECT PDF THUMBNAIL (NEVER RELOADS) ──────────────────────
const PdfThumbnail = ({ url, fileName, fileId }) => {
  const canvasRef = useRef(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null); // ← NEW: State for data URL
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!url || cancelled) return;

      // 1. Try cache first (memory + IndexedDB)
      const cached = await getCachedThumbnail(url, fileId);
      if (cached && !cancelled) {
        setThumbnailUrl(cached);
        setLoading(false);
        return;
      }

      // 2. If no cache → generate
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.2 });

        const canvas = canvasRef.current;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: canvas.getContext("2d"),
          viewport,
        };

        await page.render(renderContext).promise;

        if (cancelled) return;

        const dataUrl = canvas.toDataURL("image/webp", 0.9);
        await saveThumbnailToCache(url, fileId, dataUrl);
        setThumbnailUrl(dataUrl);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.warn("PDF thumb failed:", fileName);
          setLoading(false);
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [url, fileName, fileId]);

  // ← RENDER: Use thumbnailUrl instead of canvas
  return (
    <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-xs text-gray-400">PDF</div>
        </div>
      )}

      {/* Show cached image — never flickers */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt="PDF preview"
          className="w-full h-full object-cover"
          style={{ display: loading ? "none" : "block" }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
          style={{ display: thumbnailUrl || loading ? "none" : "block" }}
        />
      )}

      {!loading && (
        <div className="absolute bottom-1 right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
          PDF
        </div>
      )}
    </div>
  );
};

// ────────────────────── ORIGINAL COMPONENT (UNCHANGED LOGIC) ──────────────────────
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString();
  } catch {
    return null;
  }
};

export default function TokenFolders() {
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [owner, setOwner] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [index, setIndex] = useState(0);
  const [allowDownload, setAllowDownload] = useState(false);

  const POLLING_INTERVAL = 5000;

  const fetchData = useCallback(async () => {
    try {
      const { data } = await Axios({ ...SummaryApi.GetUpdateTokenFolder });
      if (data.success) {
        setFolders(data.data || []);
        setOwner(data.linkedOwner || {});
        setAllowDownload(data.allowDownload === true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load folders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const block = (e) => {
      if (!previewFile) return;
      if (
        [44, 123].includes(e.keyCode) ||
        (e.ctrlKey && e.shiftKey && [73, 67].includes(e.keyCode)) ||
        (e.ctrlKey && [85, 83].includes(e.keyCode))
      ) {
        e.preventDefault();
        toast.warn("Action blocked for security");
      }
    };
    document.addEventListener("keydown", block);
    document.addEventListener("keyup", block);
    return () => {
      document.removeEventListener("keydown", block);
      document.removeEventListener("keyup", block);
    };
  }, [previewFile]);

  const filteredFolders = useMemo(() => {
    let list = folders.map((f) => ({
      ...f,
      files: f.files.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }));

    list.forEach((f) => {
      f.files.sort(
        sortBy === "name"
          ? (a, b) => a.name.localeCompare(b.name)
          : (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    });

    return list.filter((f) => f.files.length > 0);
  }, [folders, searchTerm, sortBy]);

  const openPreview = (folder, i) => {
    setCurrentFolder(folder);
    setPreviewFile(folder.files[i]);
    setIndex(i);
  };

  const nextFile = () => {
    if (currentFolder && index < currentFolder.files.length - 1) {
      const newIndex = index + 1;
      setIndex(newIndex);
      setPreviewFile(currentFolder.files[newIndex]);
    }
  };

  const prevFile = () => {
    if (currentFolder && index > 0) {
      const newIndex = index - 1;
      setIndex(newIndex);
      setPreviewFile(currentFolder.files[newIndex]);
    }
  };

  const handleDownload = (url, name) => {
    if (!allowDownload) {
      toast.error("Download disabled by owner");
      return;
    }
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        toast.success("Download started");
      })
      .catch(() => toast.error("Download failed"));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <Loader2 className="animate-spin mr-3" size={28} />
        Loading folders...
      </div>
    );

  if (!folders.length)
    return (
      <div className="text-center py-20 text-gray-400">
        <FolderIcon size={64} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg">No shared folders found.</p>
      </div>
    );

  const statusClasses = allowDownload
    ? "bg-green-100/50 text-green-800 border-green-300"
    : "bg-red-100/50 text-red-800 border-red-300";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Shared Files Access
        </h1>
        {owner && (
          <p className="text-gray-600 mt-1">
            Shared by{" "}
            <span className="font-semibold text-orange-600">
              {owner.username}
            </span>
            {owner.email && ` (${owner.email})`}
          </p>
        )}
        <div
          className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border shadow-sm ${statusClasses}`}
        >
          {allowDownload ? <Download size={16} /> : <Lock size={16} />}
          Downloads are{" "}
          <span className="font-bold">
            {allowDownload ? "ENABLED" : "DISABLED"}
          </span>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-2 focus:ring-orange-500 outline-none transition"
          />
        </div>
        <button
          onClick={() => setSortBy((p) => (p === "name" ? "date" : "name"))}
          className="px-6 py-3 border border-gray-300 rounded-xl flex items-center gap-2 hover:bg-orange-50 transition shadow-sm"
        >
          <ArrowUpDown size={18} /> Sort by: Name
        </button>
      </div>

      {/* Folders Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFolders.map((folder) => (
          <motion.div
            key={folder.folderId}
            layout
            whileHover={{ y: -3 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition duration-300"
          >
            <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderIcon className="text-orange-600" size={28} />
                  <h3 className="font-bold text-lg text-gray-800 truncate">
                    {folder.folderName}
                  </h3>
                </div>
                <span className="bg-orange-600 text-white text-xs px-3 py-1 rounded-full shadow-md">
                  {folder.files.length} Files
                </span>
              </div>
            </div>

            {/* UPDATED FILE LIST WITH REAL PDF THUMBNAILS */}
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto hide-scrollbar">
              {folder.files.map((file, i) => {
                const displayDate = formatDate(file.createdAt);
                const isImage = file.name.match(
                  /\.(jpe?g|png|gif|webp|bmp|tiff)$/i
                );
                const isPdf = file.name.match(/\.pdf$/i);

                return (
                  <motion.div
                    key={file.fileId}
                    className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-orange-400 cursor-pointer transition-all duration-300 shadow-md hover:shadow-xl"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openPreview(folder, i)}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* THUMBNAIL */}
                      {isImage ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm flex-shrink-0">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : isPdf ? (
                        <PdfThumbnail
                          url={file.url}
                          fileName={file.name}
                          fileId={file.fileId}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                          <File className="w-9 h-9 text-gray-500" />
                        </div>
                      )}

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-sm">
                          {file.name}
                        </p>
                        {displayDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {displayDate}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Download Button */}
                    {allowDownload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file.url, file.name);
                        }}
                        className="absolute top-3 right-3 p-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* PREVIEW MODAL — UNCHANGED */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            className="fixed inset-0 bg-black/98 z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              className="relative w-full max-w-6xl h-full max-h-screen bg-black rounded-3xl overflow-hidden shadow-4xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-5 bg-gradient-to-b from-black/95 via-black/70 to-transparent backdrop-blur-xl">
                <h3 className="text-white text-lg md:text-2xl font-bold truncate max-w-md">
                  {previewFile.name}
                </h3>
                <div className="flex items-center gap-3">
                  {currentFolder?.files.length > 1 && (
                    <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-white text-sm font-medium">
                      {index + 1} / {currentFolder.files.length}
                    </span>
                  )}
                  {allowDownload && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(previewFile.url, previewFile.name);
                      }}
                      className="p-3.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-2xl hover:scale-110 transition"
                    >
                      <Download size={26} className="text-white" />
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-3.5 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition"
                  >
                    <X size={28} className="text-white" />
                  </button>
                </div>
              </div>

              {currentFolder?.files.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevFile();
                    }}
                    disabled={index === 0}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 z-40 p-5 rounded-full transition-all ${
                      index === 0
                        ? "bg-black/30 opacity-50"
                        : "bg-white/20 hover:bg-white/30 backdrop-blur"
                    }`}
                  >
                    <ChevronLeft size={44} className="text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextFile();
                    }}
                    disabled={index === currentFolder.files.length - 1}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 z-40 p-5 rounded-full transition-all ${
                      index === currentFolder.files.length - 1
                        ? "bg-black/30 opacity-50"
                        : "bg-white/20 hover:bg-white/30 backdrop-blur"
                    }`}
                  >
                    <ChevronRight size={44} className="text-white" />
                  </button>
                </>
              )}

              <div className="h-full w-full flex items-center justify-center pt-20 pb-12 px-4">
                {previewFile.name.match(/\.(jpe?g|png|gif|webp|bmp|tiff)$/i) ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-full object-contain rounded-3xl shadow-3xl select-none pointer-events-none"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                ) : previewFile.name.match(/\.pdf$/i) ? (
                  <div className="relative w-full h-full">
                    <div
                      className="absolute top-0 left-0 right-0 h-16 z-[51] pointer-events-auto"
                      style={{ backgroundColor: "transparent" }}
                    />
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(
                        previewFile.url
                      )}&embedded=true`}
                      className="w-full h-full rounded-2xl border-0 shadow-2xl"
                      title="Secure PDF Preview"
                      sandbox="allow-scripts allow-same-origin allow-popups"
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <File size={90} className="text-white/50 mx-auto mb-6" />
                    <p className="text-3xl font-bold text-white/90">
                      Preview Not Available
                    </p>
                    <p className="text-white/60 mt-3">
                      This file cannot be displayed
                    </p>
                  </div>
                )}
              </div>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/15 text-6xl md:text-8xl font-black pointer-events-none select-none">
                {owner?.username?.toUpperCase()} ONLY
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
