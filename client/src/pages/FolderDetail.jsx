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
  Search,
  SortAsc,
  SortDesc,
  File as FileIcon,
  Folder as FolderIcon,
  Printer,
  Download,
  Share2,
  MoreVertical,
  Square,
  CheckSquare,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Axios from "../api/Axios";
import SummaryApi from "../api/SummaryApi";
import FileUpload from "../components/FileUpload";
import { useDispatch, useSelector } from "react-redux";
import { addFileToFolder, setCurrentFolder } from "../storeSlices/folderSlice";
import { motion, AnimatePresence } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist";
import { get, set } from "idb-keyval";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

// ────────────────────── THUMBNAIL CACHING (PERFECT) ──────────────────────
const memoryCache = new Map();
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

const PdfThumbnail = ({ url, fileName, fileId }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const renderThumbnail = async () => {
      if (!url || cancelled) return;
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
        const pdf = await pdfjsLib.getDocument(url).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport })
          .promise;
        if (cancelled) return;
        const dataUrl = canvas.toDataURL("image/webp", 0.9);
        await saveThumbnailToCache(url, fileId, dataUrl);
        setLoading(false);
      } catch (err) {
        if (!cancelled) setLoading(false);
      }
    };
    renderThumbnail();
    return () => {
      cancelled = true;
    };
  }, [url, fileName, fileId]);

  return (
    <div className="relative w-full h-40 bg-gray-100 rounded-lg border overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-xs text-gray-500 animate-pulse">Loading...</div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover rounded-lg"
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

const ActionButton = ({ onClick, icon: Icon, color, fullWidth = false }) => (
  <button
    onClick={onClick}
    className={`${
      fullWidth ? "col-span-2" : "col-span-1"
    } p-3 rounded-xl hover:bg-gray-100 transition-all group flex items-center justify-center`}
  >
    <Icon
      size={16}
      className={`${color} group-hover:scale-110 transition-transform`}
    />
  </button>
);

ReactModal.setAppElement("#root");

function FolderDetail() {
  const { id } = useParams();
  const [files, setFiles] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [editingFileId, setEditingFileId] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // ────────────────────── UNIVERSAL DELETE STATE (Single + Bulk) ──────────────────────
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    fileIds: [], // Array of file IDs to delete
  });

  // ────────────────────── SELECTION MODE ──────────────────────
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showSelectToast, setShowSelectToast] = useState(false);

  const longPressTimer = useRef(null);
  const doubleClickTimer = useRef(null);
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const currentFolder = useSelector((state) => state.folder.currentFolder);
  const [menuOpen, setMenuOpen] = useState(null);

  // ────────────────────── ENTER SELECTION MODE ──────────────────────
  const enterSelectMode = (fileId) => {
    setSelectedFiles(new Set([fileId]));
    setIsSelectMode(true);
    setShowSelectToast(true);
    setTimeout(() => setShowSelectToast(false), 1500);
  };

  useEffect(() => {
    if (editingFileId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // selects whole name for fast editing
    }
  }, [editingFileId]); // ← ADD THIS WHOLE useEffect

  const handleCardClick = (fileId, e) => {
    if (isSelectMode) {
      toggleSelection(fileId);
      return;
    }
    if (doubleClickTimer.current) {
      clearTimeout(doubleClickTimer.current);
      doubleClickTimer.current = null;
      enterSelectMode(fileId);
      return;
    }
    doubleClickTimer.current = setTimeout(() => {
      doubleClickTimer.current = null;
      openFile(files.findIndex((f) => f._id === fileId));
    }, 300);
  };

  const handleMouseDown = (fileId) => {
    if (isSelectMode) return;
    longPressTimer.current = setTimeout(() => enterSelectMode(fileId), 600);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const toggleSelection = (fileId) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) newSet.delete(fileId);
      else newSet.add(fileId);
      setIsSelectMode(newSet.size > 0);
      return newSet;
    });
  };

  const selectAll = () =>
    setSelectedFiles(new Set(filteredFiles.map((f) => f._id)));
  const deselectAll = () => {
    setSelectedFiles(new Set());
    setIsSelectMode(false);
  };

  // ────────────────────── UNIVERSAL DELETE HANDLER (Single OR Bulk) ──────────────────────
  const confirmAndDelete = async () => {
    const fileIds = confirmDelete.fileIds;
    if (fileIds.length === 0) return;

    const count = fileIds.length;
    toast.loading(`Deleting ${count} file${count > 1 ? "s" : ""}...`);

    try {
      const results = await Promise.allSettled(
        fileIds.map((id) => Axios({ ...SummaryApi.deleteFile(id) }))
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      const successCount = count - failed;

      toast.dismiss();

      if (failed === 0) {
        toast.success(
          `Deleted ${successCount} file${successCount > 1 ? "s" : ""}`
        );
      } else {
        toast.warn(`${successCount} deleted, ${failed} failed`);
      }

      // Remove from UI
      setFiles((prev) => prev.filter((f) => !fileIds.includes(f._id)));

      // Exit selection mode if active
      if (isSelectMode) deselectAll();
    } catch {
      toast.dismiss();
      toast.error("Delete failed");
    } finally {
      setConfirmDelete({ open: false, fileIds: [] });
    }
  };

  // Trigger delete from 3-dot menu (single)
  const triggerSingleDelete = (fileId) => {
    setConfirmDelete({ open: true, fileIds: [fileId] });
    setMenuOpen(null);
  };

  // Trigger bulk delete from top bar
  const triggerBulkDelete = () => {
    if (selectedFiles.size === 0) return;
    setConfirmDelete({ open: true, fileIds: Array.from(selectedFiles) });
  };

  // ────────────────────── FILE PREVIEW & URL VALIDATION ──────────────────────
  const isValidUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

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
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

  // ────────────────────── FETCH DATA ──────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await Axios({ ...SummaryApi.getFilesInFolder(id) });
        if (data?.success) {
          setFiles(data.data);
          dispatch(addFileToFolder(data.data));
        }
      } catch {
        toast.error("Failed to load files");
      }
      try {
        const { data } = await Axios({ ...SummaryApi.getFolder(id) });
        if (data?.success) dispatch(setCurrentFolder(data.data));
      } catch {}
    };
    fetch();
  }, [id, dispatch]);

  const openFile = (index) => setSelectedFileIndex(index);
  const closeModal = () => setSelectedFileIndex(null);
  const nextFile = () => setSelectedFileIndex((i) => (i + 1) % files.length);
  const prevFile = () =>
    setSelectedFileIndex((i) => (i === 0 ? files.length - 1 : i - 1));
  const selectedFile = files[selectedFileIndex];

  // ────────────────────── ALL YOUR EXISTING HANDLERS (UNCHANGED) ──────────────────────
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

    if (supported && navigator.share && location.protocol === "https:") {
      try {
        const res = await fetch(fileUrl, { cache: "no-cache" });
        const blob = await res.blob();
        const file = new File([blob], fileName, {
          type: ext === "pdf" ? "application/pdf" : blob.type,
        });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
          toast.success("File shared!");
          return;
        }
      } catch {}
    }
    if (navigator.share) {
      await navigator.share({ url: fileUrl, title: fileName });
      toast.success("Shared!");
    } else {
      navigator.clipboard.writeText(fileUrl);
      toast.success("Link copied!");
    }
  };

  // Function to handle downloading one or more files
  
  
  const triggerBulkDownload = async () => {
    if (selectedFiles.size === 0) return;

    const filesToDownload = files.filter((f) => selectedFiles.has(f._id));
    const count = filesToDownload.length;

    // Show a toast only for multiple downloads
    if (count > 1) {
      toast.info(
        `Starting download of ${count} file${count > 1 ? "s" : ""}...`
      );
    }

    // Iterate over files and call the single-file download function
    for (const file of filesToDownload) {
      await handleDownload(file.url, file.name);
      // Add a small delay to help browsers manage multiple downloads
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (count > 1) {
      toast.success("Bulk download initiated.");
    }
  };

  // Function to handle sharing one or more files
const triggerBulkShare = async () => {
  if (selectedFiles.size === 0) return;

  const filesToShare = files.filter((f) => selectedFiles.has(f._id));
  const count = filesToShare.length;
  let fileShareAttempted = false;

  // --- 1. Attempt Native File Sharing (Single or Multiple) ---
  if (navigator.share && location.protocol === "https:") {
    fileShareAttempted = true;
    try {
      toast.loading(
        `Preparing ${count} file${count > 1 ? "s" : ""} for sharing...`
      );

      // Fetch all file contents with better error tracking
      const filePromises = filesToShare.map(async (file) => {
        try {
          const res = await fetch(file.url, { cache: "no-cache" });
          if (!res.ok) throw new Error(`HTTP ${res.status} for ${file.name}`);
          const blob = await res.blob();
          const ext = file.name.split(".").pop()?.toLowerCase();
          return new File([blob], file.name, {
            type: ext === "pdf" ? "application/pdf" : blob.type,
          });
        } catch (error) {
          console.warn(`Failed to load ${file.name}:`, error);
          return null; // Skip failed files
        }
      });

      const loadedFiles = (await Promise.all(filePromises)).filter(
        (f) => f !== null
      );
      toast.dismiss();

      // Provide feedback on partial success
      if (loadedFiles.length === 0) {
        toast.error("Unable to load any files for sharing.");
        // Skip to fallback
      } else if (loadedFiles.length < count) {
        toast.warn(
          `Only ${loadedFiles.length}/${count} files loaded. Sharing available ones.`
        );
      }

      // Check and attempt share
      if (
        loadedFiles.length > 0 &&
        navigator.canShare?.({ files: loadedFiles })
      ) {
        await navigator.share({
          files: loadedFiles,
          title: `Shared Files (${loadedFiles.length})`,
          text: `Content sharing from ${
            currentFolder?.name || "your storage"
          }.`,
        });
        toast.success(
          `Shared ${loadedFiles.length} file${
            loadedFiles.length > 1 ? "s" : ""
          } successfully!`
        );
        return; // Success
      } else if (loadedFiles.length > 0) {
        toast.warn(
          "Native sharing not supported for these files. Falling back to link sharing."
        );
      }
    } catch (err) {
      toast.dismiss();
      console.error("Native file share failed:", err);
      toast.error("File sharing failed. Trying link sharing.");
    }
  }

  // --- 2. Fallback: Share Links (Enhanced) ---
  let linkUrl, linkTitle, linkMessage;

  if (count === 1) {
    linkUrl = filesToShare[0].url;
    linkTitle = filesToShare[0].name;
    linkMessage = "Sharing file link instead.";
  } else if (currentFolder?._id) {
    // For multiple files, share the folder URL
    linkUrl = `${window.location.origin}/folder/${currentFolder._id}`;
    linkTitle = `Folder: ${currentFolder.name} (${count} files)`;
    linkMessage = "Sharing folder link for multiple files.";
  } else {
    // Last resort: Generate a temporary shareable page or list URLs
    // Option A: Create a comma-separated list of URLs (if short)
    const urls = filesToShare.map((f) => f.url).join(", ");
    if (urls.length < 2000) {
      // Avoid overly long URLs
      linkUrl = urls;
      linkTitle = `Shared Files (${count})`;
      linkMessage = "Sharing list of file links.";
    } else {
      // Option B: Suggest emailing or manual copy (if too many)
      toast.error(
        "Too many files to share as links. Consider downloading and attaching manually."
      );
      return;
    }
  }

  // Execute fallback
  if (navigator.share) {
    await navigator.share({
      url: linkUrl,
      title: linkTitle,
      text: linkMessage,
    });
    toast.info(linkMessage);
  } else {
    navigator.clipboard.writeText(linkUrl);
    toast.info(`Link copied: ${linkMessage}`);
  }
};


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

  return (
    <div className="p-4 sm:p-6  min-h-screen relative">
      {/* TOP SELECTION BAR */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            // Use 'inset-x-0' for better coverage, and p-safe-top (if using a safe-area utility)
            // Otherwise, the default 'top-0 left-0 right-0' is fine.
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between **px-3 py-3 sm:px-5 sm:py-4**">
              {/* LEFT SIDE: Deselect & Count */}
              <div className="flex items-center **gap-2 sm:gap-4**">
                <button
                  onClick={deselectAll}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <X size={24} />
                </button>
                <span className="**text-sm sm:text-lg** font-semibold">
                  {selectedFiles.size} selected
                </span>
              </div>

              {/* RIGHT SIDE: Action Buttons */}
              <div className="flex  items-center gap-4 sm:gap-2">
                {/* Bulk Share Button (Icon-only on mobile) */}
                <button
                  onClick={triggerBulkShare}
                  disabled={selectedFiles.size === 0}
                  className="flex gap-2 items-center  px-2 py-2 sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
                >
                  <Share2 size={20} />
                  <span className="hidden sm:inline">Share</span>
                </button>

                {/* Bulk Download Button (Icon-only on mobile) */}
                <button
                  onClick={triggerBulkDownload}
                  disabled={selectedFiles.size === 0}
                  className="flex gap-2 items-center px-2 py-2 sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
                >
                  <Download size={20} />
                  <span className="hidden sm:inline">Download</span>
                </button>

                {/* Bulk Delete Button (Icon-only on mobile) */}
                <button
                  onClick={triggerBulkDelete}
                  disabled={selectedFiles.size === 0}
                  className="flex gap-2 items-center px-2 py-2 sm:px-3 sm:py-2 bg-red-500 hover:bg-red-600 rounded-xl transition disabled:opacity-50"
                >
                  <Trash2 size={20} />
                  <span className="hidden sm:inline">Delete</span>
                </button>
                {/* Select All / Deselect All (Icon-only on mobile) */}
                <button
                  onClick={
                    selectedFiles.size === filteredFiles.length
                      ? deselectAll
                      : selectAll
                  }
                  className="flex gap-2 items-center px-2 py-2 sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-xl transition"
                >
                  {selectedFiles.size === filteredFiles.length ? (
                    <CheckSquare size={20} />
                  ) : (
                    <Square size={20} />
                  )}
                  <span className="**hidden sm:inline**">All</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Selection Toast */}
      <AnimatePresence>
        {showSelectToast && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            // --- UPDATED CLASSES ---
            className="fixed top-24 lg:right-[500px] flex items-center justify-center z-50 pointer-events-none"
            // --- INNER CONTENT ---
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full shadow-2xl font-bold text-lg max-w-full mx-4">
              Selection Mode Activated
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 ${
          isSelectMode ? "mt-20" : ""
        }`}
      >
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-semibold dark:text-gray-800 flex items-center gap-2">
            <FolderIcon size={24} className="text-blue-600" />
            {currentFolder?.name || "Folder"}
          </h2>
          <p className="dark:text-gray-500 dark:text-white text-sm mt-1">
            {filteredFiles.length} files
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
      <motion.div layout className="flex flex-wrap justify-start gap-8 ">
        {filteredFiles.length === 0 ? (
          <div className="w-full py-16 text-center">
            <FolderIcon size={50} className="mx-auto text-gray-400" />
            <p className="text-gray-500 mt-3 text-sm">No files found</p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedFiles.has(file._id);
            return (
              <motion.div
                layout
                key={file._id}
                id={file._id}
                className={`relative bg-white w-[130px] sm:w-[160px] md:w-[210px] h-[220px] rounded-2xl shadow hover:shadow-xl transition-all duration-200 p-3 group cursor-pointer flex flex-col justify-between
                  ${
                    isSelected
                      ? "ring-4 ring-blue-500 scale-105 shadow-2xl"
                      : ""
                  }
                `}
                onClick={(e) => {
                  if (editingFileId) {
                    e.stopPropagation(); // ← BLOCK preview & selection while renaming
                    return;
                  }
                  handleCardClick(file._id, e);
                }}
                onMouseDown={() => {
                  if (editingFileId) return; // ← BLOCK long-press while renaming
                  handleMouseDown(file._id);
                }}
                onMouseUp={handleMouseUp}
                onTouchStart={() => {
                  if (editingFileId) return; // ← BLOCK long-press on mobile while renaming
                  handleMouseDown(file._id);
                }}
                onTouchEnd={handleMouseUp}
              >
                {/* Checkbox */}
                {(isSelectMode || isSelected) && (
                  <div className="absolute top-3 left-3 z-40">
                    <div
                      className={`w-7 h-7 rounded-full border-2 ${
                        isSelected
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white border-gray-400"
                      } flex items-center justify-center transition`}
                    >
                      {isSelected && <Check size={16} className="text-white" />}
                    </div>
                  </div>
                )}

                <div className="flex-1">{renderPreview(file)}</div>

                {/* 3-Dot Menu */}
                {!isSelectMode && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === file._id ? null : file._id);
                      }}
                      className="bg-white/80 hover:bg-white backdrop-blur-md border border-gray-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    >
                      <MoreVertical size={20} className="text-gray-600" />
                    </button>
                    <AnimatePresence>
                      {menuOpen === file._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -20 }}
                          className="absolute h-32 p-0 m-0  right-0 top-12  bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-100 overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden z-50 transform-gpu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col p-2">
                            <ActionButton
                              onClick={() => {
                                setEditingFileId(file._id);
                                setNewFileName(file.name);
                                setMenuOpen(null);
                              }}
                              icon={Pencil}
                              color="text-blue-600"
                            />
                            <ActionButton
                              onClick={() => {
                                handleShare(file.url, file.name);
                                setMenuOpen(null);
                              }}
                              icon={Share2}
                              color="text-emerald-600"
                            />
                            <ActionButton
                              onClick={() => {
                                handleDownload(file.url, file.name);
                                setMenuOpen(null);
                              }}
                              icon={Download}
                              color="text-indigo-600"
                            />
                            <ActionButton
                              onClick={() => {
                                handlePrintPreview(file.url, file.name);
                                setMenuOpen(null);
                              }}
                              icon={Printer}
                              color="text-gray-700"
                            />
                            <ActionButton
                              onClick={() => triggerSingleDelete(file._id)}
                              icon={Trash2}
                              color="text-red-600"
                              fullWidth
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="mt-3 text-center">
                  {editingFileId === file._id ? (
                    <input
                      ref={inputRef}
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onBlur={() => handleRename(file._id)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleRename(file._id)
                      }
                      onClick={(e) => e.stopPropagation()} // ← PREVENT preview
                      onDoubleClick={(e) => e.stopPropagation()} // ← PREVENT selection
                      className="w-full px-2 py-1 text-sm border border-blue-500 rounded-md text-center bg-white shadow-inner outline-none"
                      placeholder="Enter name"
                    />
                  ) : (
                    <p
                      onClick={(e) => {
                        e.stopPropagation(); // ← PREVENT preview & selection
                        setEditingFileId(file._id);
                        setNewFileName(file.name);
                      }}
                      className="text-sm font-medium text-gray-800 truncate cursor-text select-text"
                    >
                      {file.name}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
      {/* UNIVERSAL DELETE MODAL */}
      <ReactModal
        isOpen={confirmDelete.open}
        onRequestClose={() => setConfirmDelete({ open: false, fileIds: [] })}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
        >
          <Trash2 size={60} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">
            Delete {confirmDelete.fileIds.length} File
            {confirmDelete.fileIds.length > 1 ? "s" : ""}?
          </h2>
          <p className="text-gray-600 mb-8">This action cannot be undone.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setConfirmDelete({ open: false, fileIds: [] })}
              className="px-6 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmAndDelete}
              className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
            >
              Delete Forever
            </button>
          </div>
        </motion.div>
      </ReactModal>
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
                      className="w-full h-full  border-0 rounded-2xl"
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
    </div>
  );
}

export default FolderDetail;
