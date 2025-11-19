import React, { useEffect, useState } from "react";
import {
  FolderIcon,
  Pencil,
  Trash2,
  Check,
  XCircle,
  PlusCircle,
  Sun,
  Moon,
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
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    folderId: null,
  });

  const theme = localStorage.getItem("theme") === "dark";
  const isDark = theme === "dark";

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const folders = useSelector((state) => state.folder.folders);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoading(true);
        const { data } = await Axios({ ...SummaryApi.getFolders });
        if (data?.success) {
          dispatch(setFolders(data?.data));
        } else {
          toast.error(data?.message);
        }
      } catch (error) {
        toast.error("Failed to fetch folders");
      } finally {
        setLoading(false);
      }
    };
    fetchFolders();
  }, [dispatch]);

  const handleRename = async (folderId) => {
    if (!newFolderName.trim())
      return toast.error("Folder name cannot be empty!");
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
        toast.error(data?.message);
      }
    } catch {
      toast.error("Rename failed!");
    }
  };

  const handleDelete = async (folderId) => {
    try {
      const { data } = await Axios({
        ...SummaryApi.deleteFolder(folderId),
      });
      if (data?.success) {
        toast.success("Folder deleted successfully");
        dispatch(setFolders(folders.filter((f) => f._id !== folderId)));
      } else toast.error(data?.message);
    } catch {
      toast.error("Failed to delete folder");
    } finally {
      setConfirmDelete({ open: false, folderId: null });
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-10 min-h-screen `}>
        <p className="text-gray-500 animate-pulse">Loading folders...</p>
      </div>
    );
  }

  if (!folders.length) {
    return (
      <div
        className={`flex flex-col justify-center items-center py-16 min-h-screen ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        } text-gray-400`}
      >
        <FolderIcon size={60} className="text-gray-500" />
        <p className="mt-3">No folders found</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className={`text-2xl font-semibold mb-5 flex items-center gap-2 `}>
        <FolderIcon className="text-orange-500" /> My Folders
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-5">
        {folders.map((folder) => (
          <div
            key={folder._id}
            className={`group relative flex flex-col items-center justify-center p-4 border rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              onClick={() => navigate(`/folder/${folder._id}`)}
              className="bg-orange-100 text-orange-600 p-4 rounded-full group-hover:bg-orange-600 group-hover:text-white transition"
            >
              <FolderIcon size={28} />
            </div>

            <div className="mt-2 text-center w-full">
              {editingFolderId === folder._id ? (
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleRename(folder._id)
                  }
                  className={`border rounded-lg p-1 text-sm text-center w-full outline-none ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-800"
                  }`}
                  autoFocus
                />
              ) : (
                <p
                  className={`text-sm font-medium truncate group-hover:text-orange-500 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                  onDoubleClick={() => {
                    setEditingFolderId(folder._id);
                    setNewFolderName(folder.name);
                  }}
                >
                  {folder.name || "Untitled"}
                </p>
              )}
            </div>

            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
              {editingFolderId === folder._id ? (
                <>
                  <button
                    onClick={() => handleRename(folder._id)}
                    className="bg-green-500 text-white p-1 rounded-full hover:bg-green-600"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingFolderId(null)}
                    className="bg-gray-500 text-white p-1 rounded-full hover:bg-gray-600"
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
                    className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setConfirmDelete({ open: true, folderId: folder._id })
                    }
                    className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>


      {confirmDelete.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className={`rounded-2xl p-6 w-80 text-center shadow-2xl ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <Trash2 size={40} className="text-red-500 mx-auto mb-3" />
            <h2
              className={`text-lg font-semibold mb-2 ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              Delete Folder?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to permanently delete this folder?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() =>
                  setConfirmDelete({ open: false, folderId: null })
                }
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.folderId)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
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
