import React, { useState, useEffect, useRef } from "react";
import ReactModal from "react-modal";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Trash2,
  Check,
  XCircle,
  Search,
  SortAsc,
  SortDesc,
  File as FileIcon,
  Folder as FolderIcon,
  Printer,
  Download,
  Share2,
  MoreVertical,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Axios from "../api/Axios";
import SummaryApi from "../api/SummaryApi";
import FileUpload from "../components/FileUpload";
import { useDispatch, useSelector } from "react-redux";
import { addFileToFolder, setCurrentFolder } from "../storeSlices/folderSlice";
import { motion, AnimatePresence } from "framer-motion";

// ────────────────────── PDF.js Setup (Vite 2025) ──────────────────────
import * as pdfjsLib from "pdfjs-dist";
import { get, set } from "idb-keyval";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

// ────────────────────── THUMBNAIL CACHING (Never reloads again) ──────────────────────
// ────────────────────── PERFECT THUMBNAIL CACHING (FIXED) ──────────────────────
const memoryCache = new Map();

// Use full URL + fileId (or just full URL if unique)
const getCacheKey = (url, fileId) => `pdf_thumb_${fileId || url}`;

const getCachedThumbnail = async (url, fileId) => {
  const key = getCacheKey(url, fileId);
  if (memoryCache.has(key)) return memoryCache.get(key);

  try {
    const cached = await get(key);
    if (cached) memoryCache.set(key, cached);
    return cached;
  } catch {
    return null;
  }
};

const saveThumbnailToCache = async (url, fileId, dataUrl) => {
  const key = getCacheKey(url, fileId);
  memoryCache.set(key, dataUrl);
  try {
    await set(key, dataUrl);
  } catch (err) {
    console.warn("Cache save failed", err);
  }
};
// ────────────────────── CACHED PDF THUMBNAIL COMPONENT ──────────────────────
const PdfThumbnail = ({ url, fileName, fileId }) => {
  // ← Add fileId prop
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const renderThumbnail = async () => {
      if (!url || cancelled) return;

      // Use fileId for unique cache key
      const cached = await getCachedThumbnail(url, fileId);
      if (cached && !cancelled) {
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          setLoading(false);
        };
        img.src = cached;
        return;
      }

      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = canvasRef.current;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        }).promise;

        if (cancelled) return;

        const dataUrl = canvas.toDataURL("image/webp", 0.9);
        await saveThumbnailToCache(url, fileId, dataUrl); // ← Pass fileId

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.warn("PDF thumbnail failed:", fileName, err);
          setLoading(false);
        }
      }
    };

    renderThumbnail();
    return () => {
      cancelled = true;
    };
  }, [url, fileName, fileId]); // ← Add fileId to deps

  return (
    <div className="relative w-full h-40 bg-gray-100 rounded-lg border overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-xs text-gray-500 animate-pulse">Loading...</div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-25 object-cover rounded-lg"
        style={{ display: loading ? "none" : "block" }}
      />
      {!loading && (
        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
          PDF
        </div>
      )}
    </div>
  );
};
// ────────────────────── MAIN COMPONENT ──────────────────────
ReactModal.setAppElement("#root");

const ActionButton = ({
  onClick,
  title,
  icon: Icon,
  color,
  fullWidth = false,
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`${
      fullWidth ? "col-span-2 sm:col-span-3" : "col-span-1"
    } p-2 rounded-xl hover:bg-gray-50/70 transition-all group flex  items-center justify-center text-center`}
  >
    <div className="p-1.5 rounded-full bg-white transition-all group-hover:bg-opacity-0">
      <Icon
        size={12}
        className={`mx-auto ${color} transition-transform group-hover:scale-110`}
      />
    </div>
    {/* Label visible on small screens (mobile UX improvement) */}
    <span className="text-xs mt-1 text-gray-500 font-medium hidden sm:block">
      {title}
    </span>
  </button>
);
function FolderDetail() {
  const { id } = useParams();
  const [files, setFiles] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [editingFileId, setEditingFileId] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    fileId: null,
  });

  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const currentFolder = useSelector((state) => state.folder.currentFolder);
  const [menuOpen, setMenuOpen] = useState(null); // Tracks which file's menu is open
  // OLD (dangerous – crashes on invalid URL)

  // NEW – SAFE VERSION (Never crashes)
  const isValidUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    try {
      // Only allow http/https
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data } = await Axios({ ...SummaryApi.getFilesInFolder(id) });
        if (data?.success) {
          setFiles(data?.data);
          dispatch(addFileToFolder(data?.data));
        } else toast.error(data?.message || "Failed to load files");
      } catch {
        toast.error("Failed to load files");
      }
    };

    const getFolder = async () => {
      try {
        const { data } = await Axios({ ...SummaryApi.getFolder(id) });
        if (data?.success) dispatch(setCurrentFolder(data.data));
      } catch {
        toast.error("Failed to load folder");
      }
    };

    fetchFiles();
    getFolder();
  }, [id, dispatch]);

  useEffect(() => {
    if (editingFileId && inputRef.current) inputRef.current.focus();
  }, [editingFileId]);

  const handleRename = async (fileId) => {
    if (!newFileName.trim()) return toast.error("Name cannot be empty");
    try {
      const { data } = await Axios({
        ...SummaryApi.renameFile(fileId),
        data: { newFileName },
      });
      if (data.success) {
        toast.success("Renamed successfully");
        setFiles((prev) =>
          prev.map((f) => (f._id === fileId ? { ...f, name: newFileName } : f))
        );
        setEditingFileId(null);
        setNewFileName("");
      } else toast.error(data.message);
    } catch {
      toast.error("Rename failed");
    }
  };

  const handleDelete = async (fileId) => {
    try {
      const card = document.getElementById(fileId);
      if (card)
        card.classList.add(
          "opacity-0",
          "scale-90",
          "transition-all",
          "duration-300"
        );

      const { data } = await Axios({ ...SummaryApi.deleteFile(fileId) });
      if (data?.success) {
        setTimeout(
          () => setFiles((prev) => prev.filter((f) => f._id !== fileId)),
          300
        );
        toast.success("File deleted");
        setConfirmDelete({ open: false, fileId: null });
      } else toast.error(data.message);
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error("Download failed");
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  // ────────────────────── UNIVERSAL SHARE (Web + Android App + iOS) ──────────────────────
const handleShare = async (fileUrl, fileName) => {
  if (!fileUrl || !isValidUrl(fileUrl)) return toast.error("Invalid file");

  const ext = fileName.split(".").pop()?.toLowerCase();
  const supported = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "pdf",
    "mp4",
    "docx",
    "txt",
  ].includes(ext);

  // ONLY TRY REAL FILE SHARE ON HTTPS (not localhost)
  if (supported && navigator.share && location.protocol === "https:") {
    try {
      const res = await fetch(fileUrl, { cache: "no-cache" });
      const blob = await res.blob();

      const file = new File([blob], fileName, {
        type:
          ext === "pdf"
            ? "application/pdf"
            : blob.type || "application/octet-stream",
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
        toast.success("File shared!");
        return;
      }
    } catch (err) {
      // Silent — expected on localhost or APK
    }
  }

  // Fallback — works everywhere
  if (navigator.share) {
    await navigator.share({ url: fileUrl, title: fileName });
    toast.success("Shared!");
  } else {
    navigator.clipboard.writeText(fileUrl);
    toast.success("Link copied!");
  }
};

  // ────────────────────── PERFECT PRINT (Image + PDF) ──────────────────────
  const handlePrintPreview = async (fileUrl, fileName = "document") => {
    if (!fileUrl) return toast.error("No file to print");

    const ext = fileName.split(".").pop()?.toLowerCase();
    const isImage = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "bmp",
    ].includes(ext);
    const isPDF = ext === "pdf";

    if (!isImage && !isPDF) return toast.error("Print not supported");

    toast.loading("Preparing print...", { autoClose: false });

    let printUrl = fileUrl;

    if (isPDF) {
      try {
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        }).promise;
        printUrl = canvas.toDataURL("image/png");
        toast.dismiss();
      } catch (err) {
        toast.dismiss();
        toast.error("Failed to load PDF");
        console.error(err);
        return;
      }
    } else {
      toast.dismiss();
    }

    // ────── DETECT IF RUNNING IN ANDROID WEBVIEW / CONVERTED APP ──────
    const isAndroidApp =
      /Android/i.test(navigator.userAgent) &&
      (/WebView/i.test(navigator.userAgent) ||
        !window.chrome ||
        window.location.href.startsWith("file://") ||
        navigator.userAgent.includes("wv"));

    if (isAndroidApp) {
      // ────── ANDROID APP: Open print using NEW WINDOW (Works in 99% converters) ──────
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        toast.error("Please allow popups");
        return;
      }

      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body,html{margin:0;padding:20px;background:white;display:flex;justify-content:center;align-items:center;height:100vh;}
            img{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.2);}
            @media print{
              body{padding:0 !important;margin:0 !important;}
              img{box-shadow:none;border-radius:0;}
              @page{margin:0.5cm;}
            }
          </style>
        </head>
        <body>
          <img src="${printUrl}" alt="${fileName}" />
          <script>
            // Auto print after load
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 800);
            };
            // Optional: Close after print
            window.onafterprint = function() {
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();

      toast.success("Print opened");
      return;
    }

    // ────── BROWSER: Your original perfect iframe method (unchanged) ──────
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0;";
    document.body.appendChild(iframe);

    iframe.contentWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body,html{margin:0;padding:0;height:100%;background:white;display:flex;justify-content:center;align-items:center;}
          img{max-width:95%;max-height:95%;object-fit:contain;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.3);}
          @media print{
            body{-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:0;margin:0;}
            img{box-shadow:none;border-radius:0;}
          }
        </style>
      </head>
      <body onload="setTimeout(() => window.print(), 500)">
        <img src="${printUrl}" />
      </body>
    </html>
  `);
    iframe.contentWindow.document.close();

    setTimeout(() => iframe.remove(), 20000);
  };

  const openFile = (index) => setSelectedFileIndex(index);
  const closeModal = () => setSelectedFileIndex(null);
  const nextFile = () => setSelectedFileIndex((i) => (i + 1) % files.length);
  const prevFile = () =>
    setSelectedFileIndex((i) => (i === 0 ? files.length - 1 : i - 1));
  const selectedFile = files[selectedFileIndex];

  const renderPreview = (file) => {
    const ext = (file.name?.split(".").pop() || "").toLowerCase();

    if (!isValidUrl(file.url)) {
      return (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-100 rounded-lg border text-gray-500">
          <FileIcon size={35} />
          <p className="text-xs mt-1">Invalid URL</p>
        </div>
      );
    }

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="w-full h-40 object-cover rounded-lg border"
          loading="lazy"
        />
      );
    }

    if (ext === "pdf") {
      return (
        <PdfThumbnail url={file.url} fileName={file.name} fileId={file._id} />
      );
    }
    if (["mp4", "webm", "ogg"].includes(ext)) {
      return (
        <video
          src={file.url}
          controls
          className="w-full h-40 object-cover rounded-lg border"
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-40 bg-gray-100 rounded-lg border text-gray-500">
        <FileIcon size={35} />
        <p className="text-xs mt-1">No Preview</p>
      </div>
    );
  };

  const filteredFiles = [...files]
    .filter((f) =>
      (f.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      sortAsc
        ? (a.name || "").localeCompare(b.name || "")
        : (b.name || "").localeCompare(a.name || "")
    );

  const theme = localStorage.getItem("theme");

  return (
    <div className="p-4 sm:p-6 bg-transparent min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <FolderIcon size={24} className="text-blue-600" />
            <div className={theme === "dark" ? "text-white" : "text-black"}>
              {currentFolder?.name || "Folder"}
            </div>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
          <div className="flex items-center border rounded-xl bg-white px-3 py-1.5 w-full sm:w-60 shadow-sm">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ml-2 w-full outline-none text-sm"
            />
          </div>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="bg-blue-500 text-white rounded-xl px-3 py-2 flex items-center gap-1 hover:bg-blue-600 transition"
          >
            {sortAsc ? <SortAsc size={16} /> : <SortDesc size={16} />}
            <span className="hidden sm:inline text-sm">Sort</span>
          </button>
          <FileUpload folderId={id} setFiles={setFiles} />
        </div>
      </div>

      {/* File Grid */}
      <motion.div layout className="flex flex-wrap justify-start gap-4">
        {filteredFiles.length === 0 ? (
          <div className="w-full py-16 text-center">
            <FolderIcon size={50} className="mx-auto text-gray-400" />
            <p className="text-gray-500 mt-3 text-sm">No files found</p>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <motion.div
              layout
              key={file._id}
              id={file._id}
              className="relative bg-white w-[140px] sm:w-[170px] md:w-[210px] h-[220px] rounded-2xl shadow hover:shadow-xl transition-all duration-200 p-3 group cursor-pointer flex flex-col justify-between"
            >
              <div
                onClick={() =>
                  openFile(files.findIndex((f) => f._id === file._id))
                }
                className="flex-1"
              >
                {renderPreview(file)}
              </div>

              {/* 3-DOT MENU — MODERN & CLEAN */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
                {/* 1. PRIMARY MENU BUTTON (3-Dots) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === file._id ? null : file._id);
                  }}
                  // Modern, glass-like button styling
                  className="bg-white/80 hover:bg-white backdrop-blur-md border border-gray-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-200"
                  aria-label="Open file actions menu"
                >
                  <MoreVertical size={20} className="text-gray-600" />
                </button>

                {/* 2. MENU DROPDOWN (Uses AnimatePresence for smooth close) */}
                <AnimatePresence>
                  {menuOpen === file._id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -20 }}
                      transition={{ duration: 0.2 }}
                      // Glass-like container style
                      className="absolute h-32 p-0 m-0  right-0 top-12  bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-100 overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden z-50 transform-gpu"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        boxShadow:
                          "0 10px 30px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div className="  flex flex-col items-center p-0 m-0 ">
                        {/* ACTION BUTTON COMPONENT (Helper structure) */}
                        {/* The structure below provides better mobile UX by showing labels */}

                        {/* RENAME */}
                        <ActionButton
                          onClick={() => {
                            setEditingFileId(file._id);
                            setNewFileName(file.name);
                            setMenuOpen(null);
                          }}
                          // title="Rename"
                          icon={Pencil}
                          color="text-blue-600"
                        />

                        {/* SHARE */}
                        <ActionButton
                          onClick={() => {
                            setMenuOpen(null);
                            handleShare(file.url, file.name);
                          }}
                          // title="Share"
                          icon={Share2}
                          color="text-emerald-600"
                        />

                        {/* DOWNLOAD */}
                        <ActionButton
                          onClick={() => {
                            handleDownload(file.url, file.name);
                            setMenuOpen(null);
                          }}
                          // title="Download"
                          icon={Download}
                          color="text-indigo-600"
                        />

                        {/* PRINT */}
                        <ActionButton
                          onClick={() => {
                            handlePrintPreview(file.url, file.name);
                            setMenuOpen(null);
                          }}
                          // title="Print"
                          icon={Printer}
                          color="text-gray-700"
                        />

                        {/* DELETE (Full Width for Emphasis) */}
                        <ActionButton
                          onClick={() => {
                            setConfirmDelete({ open: true, fileId: file._id });
                            setMenuOpen(null);
                          }}
                          // title="Delete"
                          icon={Trash2}
                          color="text-red-600"
                          fullWidth
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-3 text-center">
                {editingFileId === file._id ? (
                  <input
                    ref={inputRef}
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onBlur={() => setEditingFileId(null)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleRename(file._id)
                    }
                    className="border rounded-md p-1 text-sm w-full text-center"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {file.name}
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Full Preview Modal */}
      <ReactModal
        isOpen={selectedFileIndex !== null}
        onRequestClose={closeModal}
        shouldCloseOnOverlayClick
        shouldCloseOnEsc
        closeTimeoutMS={350}
        className="fixed inset-0 z-[9999] outline-none"
        overlayClassName="fixed inset-0 z-[9998] flex items-center justify-center p-4 md:p-8 bg-black/70"
      >
        {selectedFile && isValidUrl(selectedFile.url) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.93 }}
            className="relative w-full h-full rounded-3xl overflow-hidden shadow-4xl flex flex-col bg-black"
          >
            <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-6 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-2xl">
              <h3 className="text-white font-semibold text-lg truncate max-w-md">
                {selectedFile.name}
              </h3>
              <div className="flex items-center gap-4">
                {files.length > 1 && (
                  <span className="bg-white/20 backdrop-blur-xl text-white px-5 py-2.5 rounded-full text-sm font-medium border border-white/30">
                    {selectedFileIndex + 1} / {files.length}
                  </span>
                )}
                <button
                  onClick={closeModal}
                  className="bg-white/20 hover:bg-white/40 backdrop-blur-xl text-white p-3.5 rounded-full transition-all hover:scale-110 shadow-xl border border-white/40"
                >
                  <X size={28} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {files.length > 1 && (
              <>
                <button
                  onClick={prevFile}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-black/60 hover:bg-black/80 rounded-full transition"
                >
                  <ChevronLeft size={36} className="text-white" />
                </button>
                <button
                  onClick={nextFile}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-black/60 hover:bg-black/80 rounded-full transition"
                >
                  <ChevronRight size={36} className="text-white" />
                </button>
              </>
            )}

            <div className="flex-1 relative mt-20 mb-8">
              {(() => {
                const ext = selectedFile.name.split(".").pop()?.toLowerCase();
                if (
                  ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)
                ) {
                  return (
                    <div className="h-full flex items-center justify-center p-8">
                      <Zoom zoomMargin={80}>
                        <img
                          src={selectedFile.url}
                          alt={selectedFile.name}
                          className="w-full h-full lg:w-[35%] m-auto object-cover rounded-xl shadow-2xl"
                          draggable={false}
                        />
                      </Zoom>
                    </div>
                  );
                }
                if (["mp4", "webm", "ogg", "mov"].includes(ext)) {
                  return (
                    <video
                      src={selectedFile.url}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  );
                }
                if (ext === "pdf") {
                  return (
                    <iframe
                      src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
                        selectedFile.url
                      )}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                      className="w-full h-full border-0 rounded-2xl"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <div className="h-full flex items-center justify-center text-white/80">
                    <FileIcon size={80} />
                    <p className="mt-6 text-2xl">Preview not available</p>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </ReactModal>

      {/* Delete Confirmation */}
      <ReactModal
        isOpen={confirmDelete.open}
        onRequestClose={() => setConfirmDelete({ open: false, fileId: null })}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center">
          <Trash2 size={40} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Delete File?
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setConfirmDelete({ open: false, fileId: null })}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(confirmDelete.fileId)}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </ReactModal>
    </div>
  );
}

export default FolderDetail;
