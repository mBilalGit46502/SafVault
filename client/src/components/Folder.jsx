import React, { useEffect, useState, useMemo } from "react";
import {
  FolderIcon,
  Pencil,
  Trash2,
  Check,
  XCircle,
  Search,
} from "lucide-react";
import Axios from "../api/Axios";
import SummaryApi from "../api/SummaryApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { setFolders } from "../storeSlices/folderSlice";
import { useDispatch, useSelector } from "react-redux";

function Folder() {
  const [loading, setLoading] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Search state
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    folderId: null,
  });

  const theme = localStorage.getItem("theme") || "light";
  const isDark = theme === "dark";

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const folders = useSelector((state) => state.folder.folders);

  // Fetch folders
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoading(true);
        const { data } = await Axios({ ...SummaryApi.getFolders });
        if (data?.success) {
          dispatch(setFolders(data?.data));
        } else {
          toast.error(data?.message || "Failed to load folders");
        }
      } catch (error) {
        toast.error("Failed to fetch folders");
      } finally {
        setLoading(false);
      }
    };
    fetchFolders();
  }, [dispatch]);

  // Smart & fast search using useMemo
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    const query = searchQuery.toLowerCase();
    return folders.filter((folder) =>
      folder.name?.toLowerCase().includes(query)
    );
  }, [folders, searchQuery]);

  const handleRename = async (folderId) => {
    if (!newFolderName.trim()) {
      return toast.error("Folder name cannot be empty!");
    }
    try {
      const { data } = await Axios({
        ...SummaryApi.renameFolder(folderId),
        data: { newName: newFolderName },
      });
      if (data?.success) {
        toast.success("Folder renamed successfully");
        dispatch(
          setFolders(
            folders.map((f) =>
              f._id === folderId ? { ...f, name: newFolderName } : f
            )
          )
        );
        setEditingFolderId(null);
        setNewFolderName("");
      } else {
        toast.error(data?.message || "Rename failed");
      }
    } catch {
      toast.error("Failed to rename folder");
    }
  };

  const handleDelete = async (folderId) => {
    try {
      const { data } = await Axios({
        ...SummaryApi.deleteFolder(folderId),
      });
      if (data?.success) {
        toast.success("Folder deleted");
        dispatch(setFolders(folders.filter((f) => f._id !== folderId)));
      } else {
        toast.error(data?.message || "Delete failed");
      }
    } catch {
      toast.error("Failed to delete folder");
    } finally {
      setConfirmDelete({ open: false, folderId: null });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-500 animate-pulse text-lg">
          Loading folders...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <FolderIcon className="text-orange-500" size={32} />
          My Folders
          <span className="text-sm font-normal text-gray-500">
            ({filteredFolders.length} folder
            {filteredFolders.length !== 1 ? "s" : ""})
          </span>
        </h2>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-10 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-orange-500/20
              ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500"
                  : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-orange-400"
              }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XCircle size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredFolders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search size={64} className="text-gray-400 mb-4 opacity-60" />
          <p className="text-lg text-gray-500">
            {searchQuery
              ? `No folders found for "${searchQuery}"`
              : "No folders yet"}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 text-orange-500 hover:underline font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        /* Folders Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
          {filteredFolders.map((folder) => (
            <div
              key={folder._id}
              className={`group relative flex flex-col items-center justify-center p-6 border rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer
                ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }
              `}
            >
              {/* Folder Icon */}
              <div
                onClick={() => navigate(`/folder/${folder._id}`)}
                className="bg-orange-100 text-orange-600 p-6 rounded-full group-hover:bg-orange-600 group-hover:text-white transition-all duration-300"
              >
                <FolderIcon size={36} />
              </div>

              {/* Folder Name */}
              <div className="mt-4 text-center w-full">
                {editingFolderId === folder._id ? (
                  <input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleRename(folder._id)
                    }
                    className={`w-full px-3 py-2 text-sm text-center border rounded-lg outline-none transition
                      ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-800"
                      }`}
                    autoFocus
                  />
                ) : (
                  <p
                    className={`text-sm font-medium truncate max-w-full px-2 group-hover:text-orange-500 transition
                      ${isDark ? "text-gray-300" : "text-gray-700"}
                    `}
                    onDoubleClick={() => {
                      setEditingFolderId(folder._id);
                      setNewFolderName(folder.name);
                    }}
                  >
                    {folder.name || "Untitled"}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                {editingFolderId === folder._id ? (
                  <>
                    <button
                      onClick={() => handleRename(folder._id)}
                      className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 shadow-lg"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingFolderId(null)}
                      className="bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600 shadow-lg"
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingFolderId(folder._id);
                        setNewFolderName(folder.name);
                      }}
                      className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-lg"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setConfirmDelete({ open: true, folderId: folder._id })
                      }
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className={`rounded-2xl p-8 w-96 text-center shadow-2xl ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <Trash2 size={48} className="text-red-500 mx-auto mb-4" />
            <h2
              className={`text-xl font-bold mb-3 ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              Delete Folder?
            </h2>
            <p className="text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() =>
                  setConfirmDelete({ open: false, folderId: null })
                }
                className="px-6 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.folderId)}
                className="px-6 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Folder;
