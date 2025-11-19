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
} from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Axios from "../api/Axios";
import SummaryApi from "../api/summaryApi";
import FileUpload from "../components/FileUpload";
import { useDispatch, useSelector } from "react-redux";
import { addFileToFolder, setCurrentFolder } from "../storeSlices/folderSlice";
import { motion } from "framer-motion";
ReactModal.setAppElement("#root");

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

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data } = await Axios({ ...SummaryApi.getFilesInFolder(id) });

        if (data?.success) {
          setFiles(data?.data); // keep this
          dispatch(addFileToFolder(data?.data));
        } else toast.error(data?.message);
      } catch {
        toast.error("Failed to load files");
      }
    };

    console.log("files", files);
    const getFolder = async () => {
      try {
        const { data } = await Axios({ ...SummaryApi.getFolder(id) });
        if (data?.success) dispatch(setCurrentFolder(data.data));
      } catch {
        toast.error("Failed to load folder info");
      }
    };

    fetchFiles();
    getFolder();
  }, [id, dispatch]);

  useEffect(() => {
    if (editingFileId && inputRef.current) inputRef.current.focus();
  }, [editingFileId]);

  const handleRename = async (fileId) => {
    if (!newFileName.trim()) return toast.error("File name cannot be empty!");
    try {
      const { data } = await Axios({
        ...SummaryApi.renameFile(fileId),
        data: { newFileName },
      });
      console.log("rename", data);

      if (data.success) {
        toast.success("File renamed successfully");
        setFiles((prevFiles) =>
          prevFiles.map((file) =>
            file._id === fileId ? { ...file, name: newFileName } : file
          )
        );

        setEditingFileId(null);
        setNewFileName("");
      } else toast.error(data?.message);
    } catch {
      toast.error("Rename failed!");
    }
  };

  const openFile = (index) => setSelectedFileIndex(index);
  const closeModal = () => setSelectedFileIndex(null);
  const nextFile = () => setSelectedFileIndex((p) => (p + 1) % files.length);
  const prevFile = () =>
    setSelectedFileIndex((p) => (p === 0 ? files.length - 1 : p - 1));
  const selectedFile = files[selectedFileIndex];

  const handleDelete = async (fileId) => {
    try {
      const card = document.getElementById(fileId);
      if (card) {
        card.classList.add(
          "opacity-0",
          "scale-90",
          "transition-all",
          "duration-300"
        );
      }

      const { data } = await Axios({ ...SummaryApi.deleteFile(fileId) });
      if (data?.success) {
        setTimeout(() => {
          setFiles((prev) => prev.filter((f) => f._id !== fileId));
        }, 300);
        toast.success(data?.message);
        setConfirmDelete({ open: false, fileId: null });
      } else toast.error(data?.message);
    } catch {
      toast.error("Delete failed!");
    }
  };
  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();

      // Create a temporary link with correct filename & extension
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || "downloaded-file";

      // Trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      toast.error("❌ Download failed. Please try again!");
      console.error("Download error:", error);
    }
  };

  const [printPreview, setPrintPreview] = useState({
    open: false,
    fileUrl: "",
  });

  const handlePrintPreview = (fileUrl) => {
    if (!fileUrl) return toast.error("No file selected to print!");

    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
    const isPDF = /\.pdf$/i.test(fileUrl);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();

    doc.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: white;
          }
          img, iframe {
            max-width: 100%;
            max-height: 100%;
          }
        </style>
      </head>
      <body>
        ${
          isImage
            ? `<img src="${fileUrl}" alt="Print Preview" />`
            : isPDF
            ? `<iframe src="${fileUrl}" frameborder="0" style="width:100%; height:100vh;"></iframe>`
            : `<p>Unsupported file type for printing.</p>`
        }
      </body>
    </html>
  `);

    doc.close();

    iframe.onload = () => {
      const printWindow = iframe.contentWindow;
      printWindow.focus();
      printWindow.print();

      printWindow.onafterprint = () => {
        document.body.removeChild(iframe);
      };
    };
  };
  const renderPreview = (file) => {
    if (!file) return null;
    const ext = (file.name?.split(".").pop() || "").toLowerCase();

    if (!isValidUrl(file.url)) {
      return (
        <div className="flex flex-col justify-center items-center bg-gray-100 w-full h-40 rounded-lg border text-gray-500">
          <FileIcon size={35} />
          <p className="text-xs mt-1">Invalid URL</p>
        </div>
      );
    }

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
      return (
        <img
          src={file.url}
          alt={file.name}
          className="w-full h-40 object-cover rounded-lg border"
          loading="lazy"
        />
      );

    if (ext === "pdf")
      return (
        <iframe
          src={file.url}
          title={file.name}
          className="w-full h-40 rounded-lg border"
        />
      );

    if (["mp4", "webm", "ogg"].includes(ext))
      return (
        <video
          src={file.url}
          controls
          className="w-full h-40 object-cover rounded-lg border"
        />
      );

    return (
      <div className="flex flex-col justify-center items-center bg-gray-100 w-full h-40 rounded-lg border text-gray-500">
        <FileIcon size={35} />
        <p className="text-xs mt-1">No Preview</p>
      </div>
    );
  };

  const filteredFiles = [...files]
    .filter((file) => {
      const fileName = file?.name || file?.originalname || file?.filename || "";
      return fileName?.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) =>
      sortAsc
        ? (a.name || a.originalname || "").localeCompare(
            b.name || b.originalname || ""
          )
        : (b.name || b.originalname || "").localeCompare(
            a.name || a.originalname || ""
          )
    );

  const theme = localStorage.getItem("theme");
  const isDark = theme === "dark";
  return (
    <div className="p-4 sm:p-6 bg-transparent min-h-screen bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <FolderIcon size={24} className="text-blue-600" />

            <div
              className={`${theme === "dark" ? "text-white" : "text-black"}`}
            >
              <div>{currentFolder?.name || "Folder"}</div>
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
            className="bg-blue-500  text-white rounded-xl px-3 py-2 flex items-center gap-1 hover:bg-blue-600 transition"
          >
            {sortAsc ? <SortAsc size={16} /> : <SortDesc size={16} />}
            <span className="hidden sm:inline text-sm">Sort</span>
          </button>

          <FileUpload folderId={id} setFiles={setFiles} />
        </div>
      </div>

      <motion.dev
        layout
        className="flex flex-wrap justify-start gap-5"
        transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
      >
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full py-16">
            <FolderIcon size={50} className="mx-auto text-gray-400" />
            <p className="text-gray-500 mt-3 text-sm">No files found.</p>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <motion.div
              layout
              key={file._id}
              className="relative bg-white w-[150px] sm:w-[180px] md:w-[210px] h-[260px] rounded-2xl shadow hover:shadow-xl transition-all duration-200 p-3 group cursor-pointer flex flex-col justify-between"
            >
              <div
                onClick={() =>
                  openFile(files.findIndex((f) => f._id === file._id))
                }
                className="flex-1"
              >
                {" "}
                {renderPreview(file)}{" "}
              </div>{" "}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                {" "}
                {editingFileId === file._id ? (
                  <>
                    {" "}
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleRename(file._id);
                      }}
                      className="bg-green-500 text-white rounded-full p-1 hover:bg-green-600"
                    >
                      {" "}
                      <Check size={18} />{" "}
                    </button>{" "}
                    <button
                      onClick={() => setEditingFileId(null)}
                      className="bg-gray-500 text-white rounded-full p-1 hover:bg-gray-600"
                    >
                      {" "}
                      <XCircle size={18} />{" "}
                    </button>{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFileId(file._id);
                        setNewFileName(file.name);
                      }}
                      className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                    >
                      {" "}
                      <Pencil size={18} />{" "}
                    </button>{" "}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintPreview(file.url);
                      }}
                      className="bg-gray-700 text-white rounded-full p-1 hover:bg-gray-800"
                    >
                      {" "}
                      <Printer size={18} />{" "}
                    </button>{" "}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file.url, file.name);
                      }}
                      className="bg-indigo-500 text-white rounded-full p-1 hover:bg-indigo-600"
                    >
                      {" "}
                      <Download size={18} />{" "}
                    </button>{" "}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({ open: true, fileId: file._id });
                      }}
                      className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      {" "}
                      <Trash2 size={18} />{" "}
                    </button>{" "}
                  </>
                )}{" "}
              </div>{" "}
              <div className="mt-3 text-center">
                {" "}
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
                    {" "}
                    {file.name}{" "}
                  </p>
                )}{" "}
              </div>
            </motion.div>
          ))
        )}
      </motion.dev>

      <ReactModal
        isOpen={selectedFileIndex !== null}
        onRequestClose={closeModal}
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      >
        {selectedFile && isValidUrl(selectedFile.url) && (
          <div className="relative w-11/12 max-w-4xl mx-auto flex flex-col items-center">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
            >
              <X size={24} />
            </button>

            <div className="flex justify-between items-center w-full">
              <button
                onClick={prevFile}
                className="text-white p-2 hover:bg-black/30 rounded-full"
              >
                <ChevronLeft size={28} />
              </button>

              <div className="max-h-[80vh] overflow-auto">
                {["jpg", "jpeg", "png", "webp", "gif"].includes(
                  selectedFile.name.split(".").pop().toLowerCase()
                ) ? (
                  <Zoom>
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.name}
                      className="max-h-[80vh] rounded-lg"
                    />
                  </Zoom>
                ) : ["mp4", "webm", "ogg"].includes(
                    selectedFile.name.split(".").pop().toLowerCase()
                  ) ? (
                  <video
                    src={selectedFile.url}
                    controls
                    className="max-h-[80vh] rounded-lg"
                  />
                ) : selectedFile.name.endsWith(".pdf") ? (
                  <iframe
                    src={selectedFile.url}
                    title={selectedFile.name}
                    className="w-[80vw] h-[80vh] rounded-lg"
                  ></iframe>
                ) : (
                  <p className="text-white text-center">No preview available</p>
                )}
              </div>

              <button
                onClick={nextFile}
                className="text-white p-2 hover:bg-black/30 rounded-full"
              >
                <ChevronRight size={28} />
              </button>
            </div>
          </div>
        )}
      </ReactModal>

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
            Are you sure you want to permanently delete this file?
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
      {printPreview.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center bg-gray-900 text-white p-3">
              <h3 className="text-lg font-semibold">Print Preview</h3>
            </div>

            <div className="flex justify-center gap-4 bg-gray-100 p-4 border-t"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FolderDetail;
