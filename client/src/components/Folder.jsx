import React, { useEffect, useState, useMemo } from "react";
import {
  FolderIcon,
  Pencil,
  Trash2,
  Check,
  XCircle,
  Search,
  SortAsc,
  SortDesc,
  GripVertical,
} from "lucide-react";
import Axios from "../api/Axios";
import SummaryApi from "../api/SummaryApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { setFolders } from "../storeSlices/folderSlice";
import { useDispatch, useSelector } from "react-redux";

import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableFolderItem = ({ folder, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 z-20 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Hold & drag"
      >
        <GripVertical size={26} className="text-gray-500 drop-shadow-md" />
      </div>
      {children}
    </div>
  );
};

function Folder() {
  const [loading, setLoading] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    folderId: null,
  });
  const [sortMode, setSortMode] = useState("manual"); // "manual" | "asc" | "desc"

  const theme = localStorage.getItem("theme") === "dark";
  const isDark = theme === "dark";

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const originalFolders = useSelector((state) => state.folder.folders); // From server

  // Manual order saved in localStorage
  const [manualOrderIds, setManualOrderIds] = useState(() => {
    const saved = localStorage.getItem("folderManualOrderIds");
    return saved ? JSON.parse(saved) : null;
  });

  // Build current folder list
  const currentFolders = useMemo(() => {
    if (!originalFolders.length) return [];

    if (sortMode === "manual" && manualOrderIds) {
      // Use manual order
      const ordered = [];
      const map = new Map(originalFolders.map((f) => [f._id, f]));

      manualOrderIds.forEach((id) => {
        if (map.has(id)) {
          ordered.push(map.get(id));
          map.delete(id);
        }
      });

      // Add any new folders at the end
      map.forEach((f) => ordered.push(f));

      return ordered;
    }

    // Default: use original order
    return [...originalFolders];
  }, [originalFolders, manualOrderIds, sortMode]);

  // Final display list with search + sort
  const displayFolders = useMemo(() => {
    let list = [...currentFolders];

    // Apply search
    if (searchQuery.trim()) {
      list = list.filter((f) =>
        f.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort
    if (sortMode === "asc") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortMode === "desc") {
      list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }

    return list;
  }, [currentFolders, searchQuery, sortMode]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  // DRAG END - Save new manual order
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSortMode("manual");

    const newOrder = arrayMove(
      displayFolders,
      displayFolders.findIndex((f) => f._id === active.id),
      displayFolders.findIndex((f) => f._id === over.id)
    );

    const newIds = newOrder.map((f) => f._id);
    setManualOrderIds(newIds);
    localStorage.setItem("folderManualOrderIds", JSON.stringify(newIds));

    // toast.success("Position saved!", { autoClose: 1000 });
  };

  // TOGGLE SORT
  const toggleSort = () => {
    if (sortMode === "asc") {
      setSortMode("desc");
      // toast.success("Sorted Z to A", { autoClose: 1000 });
    } else {
      setSortMode("asc");
      // toast.success("Sorted A to Z", { autoClose: 1000 });
    }
    // Clear manual order when sorting
    setManualOrderIds(null);
    localStorage.removeItem("folderManualOrderIds");
  };

  // FETCH FOLDERS
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoading(true);
        const { data } = await Axios({ ...SummaryApi.getFolders });
        if (data?.success) {
          dispatch(setFolders(data?.data));
        }
      } catch {
        toast.error("Failed to load folders");
      } finally {
        setLoading(false);
      }
    };
    fetchFolders();
  }, [dispatch]);

  // RENAME & DELETE
  const handleRename = async (folderId) => {
    if (!newFolderName.trim()) return toast.error("Name required");
    try {
      const { data } = await Axios({
        ...SummaryApi.renameFolder(folderId),
        data: { newName: newFolderName },
      });
      if (data?.success) {
        toast.success("Renamed!");
        const updated = originalFolders.map((f) =>
          f._id === folderId ? { ...f, name: newFolderName } : f
        );
        dispatch(setFolders(updated));
        setEditingFolderId(null);
      }
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async (folderId) => {
    try {
      const { data } = await Axios({ ...SummaryApi.deleteFolder(folderId) });
      if (data?.success) {
        toast.success("Deleted!");
        const updated = originalFolders.filter((f) => f._id !== folderId);
        dispatch(setFolders(updated));

        // Update manual order if exists
        if (manualOrderIds) {
          const newIds = manualOrderIds.filter((id) => id !== folderId);
          setManualOrderIds(newIds.length > 0 ? newIds : null);
          if (newIds.length > 0) {
            localStorage.setItem(
              "folderManualOrderIds",
              JSON.stringify(newIds)
            );
          } else {
            localStorage.removeItem("folderManualOrderIds");
          }
        }
      }
    } catch {
      toast.error("Failed");
    } finally {
      setConfirmDelete({ open: false, folderId: null });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-500 animate-pulse">Loading folders...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* SEARCH + SORT */}
      <div className="mb-8 max-w-md mx-auto">
        <div className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-10 py-3 rounded-xl border transition-all
                ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-orange-400"
                } focus:outline-none focus:ring-2 focus:ring-orange-500/30`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <XCircle size={20} className="text-gray-400" />
              </button>
            )}
          </div>

          <button
            onClick={toggleSort}
            className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all active:scale-95 shadow-lg"
            title={sortMode === "desc" ? "Sort A to Z" : "Sort Z to A"}
          >
            {sortMode === "desc" ? (
              <SortDesc size={20} />
            ) : (
              <SortAsc size={20} />
            )}
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <FolderIcon className="text-orange-500" />
        My Folders
        <span className="text-sm font-normal text-gray-500">
          ({displayFolders.length} found)
        </span>
      </h2>

      {/* DRAG & DROP */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={displayFolders.map((f) => f._id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {displayFolders.map((folder) => (
              <SortableFolderItem key={folder._id} folder={folder}>
                <div
                  className={`group relative flex flex-col items-center justify-center p-6 border rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer
                  ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div
                    onClick={() => navigate(`/folder/${folder._id}`)}
                    className="bg-orange-100 text-orange-600 p-6 rounded-full group-hover:bg-orange-600 group-hover:text-white transition-all duration-300"
                  >
                    <FolderIcon size={36} />
                  </div>

                  <div className="mt-4 text-center w-full">
                    {editingFolderId === folder._id ? (
                      <input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleRename(folder._id)
                        }
                        className={`border rounded-lg px-3 py-2 text-sm text-center w-full outline-none
                          ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                          }`}
                        autoFocus
                      />
                    ) : (
                      <p
                        className={`text-sm font-medium truncate group-hover:text-orange-500 transition
                          ${isDark ? "text-gray-300" : "text-gray-700"}`}
                        onDoubleClick={() => {
                          setEditingFolderId(folder._id);
                          setNewFolderName(folder.name);
                        }}
                      >
                        {folder.name || "Untitled"}
                      </p>
                    )}
                  </div>

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
                            setConfirmDelete({
                              open: true,
                              folderId: folder._id,
                            })
                          }
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </SortableFolderItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* DELETE MODAL */}
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
                className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.folderId)}
                className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition font-medium"
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
