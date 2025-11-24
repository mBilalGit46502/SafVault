import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  Minus,
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
import { AnimatePresence,motion } from "framer-motion";

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
    fileIds: [],
  });
  const [sortMode, setSortMode] = useState("manual"); // "manual" | "asc" | "desc"

  // Multi-Selection State
  const [selectedFolders, setSelectedFolders] = useState(new Set());

  const theme = localStorage.getItem("theme") === "dark";
  const isDark = theme;
  // Selection mode is active when selectedFolders is NOT empty
  const isSelectMode = selectedFolders.size > 0;

  // State to track if the user has explicitly clicked the Check button
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);

  // Use a combined state for rendering visibility
  const showCheckboxes = isSelectMode || isSelectionModeActive;

  // Ref for the main container to detect outside clicks
  const folderContainerRef = useRef(null);

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
      const ordered = [];
      const map = new Map(originalFolders.map((f) => [f._id, f]));

      manualOrderIds.forEach((id) => {
        if (map.has(id)) {
          ordered.push(map.get(id));
          map.delete(id);
        }
      });

      // Add any new folders that aren't in manualOrderIds to the end
      map.forEach((f) => ordered.push(f));

      return ordered;
    }

    return [...originalFolders];
  }, [originalFolders, manualOrderIds, sortMode]);

  useEffect(() => {
    if (manualOrderIds) {
      localStorage.setItem(
        "folderManualOrderIds",
        JSON.stringify(manualOrderIds)
      );
    } else {
      localStorage.removeItem("folderManualOrderIds");
    }
  }, [manualOrderIds]);

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

  // Check if all *displayed* folders are selected
  const isAllSelected = useMemo(() => {
    if (displayFolders.length === 0) return false;
    return displayFolders.every((f) => selectedFolders.has(f._id));
  }, [displayFolders, selectedFolders]);

  // Check if some but not all folders are selected (for indeterminate state)
  const isIndeterminate = useMemo(() => {
    return selectedFolders.size > 0 && !isAllSelected;
  }, [selectedFolders.size, isAllSelected]);

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

    // Automatically switch to manual mode when a drag happens
    setSortMode("manual");

    // Use currentFolders for state update, even if drag happened on a subset (displayFolders)
    const listToUse = currentFolders;

    const oldIndex = listToUse.findIndex((f) => f._id === active.id);
    const newIndex = listToUse.findIndex((f) => f._id === over.id);

    const newOrder = arrayMove(listToUse, oldIndex, newIndex);
    const newIds = newOrder.map((f) => f._id);

    setManualOrderIds(newIds);
  };

  // TOGGLE SORT
  const toggleSort = () => {
    const newMode = sortMode === "asc" ? "desc" : "asc";
    setSortMode(newMode);
    setManualOrderIds(null); // Clear manual order when switching to alphabetical sort
    localStorage.removeItem("folderManualOrderIds");
  };

  // --- Selection Logic ---

  const handleToggleSelection = useCallback((folderId) => {
    setSelectedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
    // Crucial: Set selection mode active when an item is manually selected via checkbox/click
    setIsSelectionModeActive(true);
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setSelectedFolders(new Set());
    setIsSelectionModeActive(false);
  }, []);

  // Card click logic
  const handleCardClick = useCallback(
    (folderId) => {
      if (editingFolderId) return;

      if (showCheckboxes) {
        // If selection mode is active (checkboxes visible), toggle selection
        handleToggleSelection(folderId);
      } else {
        // If selection mode is not active, navigate to the folder
        navigate(`/folder/${folderId}`);
      }
    },
    [editingFolderId, showCheckboxes, handleToggleSelection, navigate]
  );

  const handleCardDoubleClick = useCallback((folderId, e) => {
    // Prevent default card action if clicking an actionable element
    if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
      return;
    }
  }, []);

  /**
   * Toggles the state to show checkboxes without selecting all items.
   * If mode is active, it exits mode. If inactive, it enters mode (deselects all).
   */
  const handleToggleSelectionMode = () => {
    if (showCheckboxes) {
      // If mode is active (either selected or just active), exit mode
      handleExitSelectionMode();
    } else {
      // If mode is inactive, enter mode but select nothing
      setIsSelectionModeActive(true);
    }
  };

  // Select All visible folders
  const handleSelectAll = useCallback(() => {
    const allIds = new Set(displayFolders.map((f) => f._id));
    setSelectedFolders(allIds);
    setIsSelectionModeActive(true);
    toast.info(`Selected all ${allIds.size} visible folders.`);
  }, [displayFolders]);

  // Deselect All visible folders
  const handleDeselectAll = useCallback(() => {
    setSelectedFolders(new Set());
    // Keep isSelectionModeActive true so checkboxes remain visible until the user exits
    toast.info(`Deselected all folders.`);
  }, []);

  // Toggle function for the single "Select All" Checkbox
  const handleAllSelectCheckboxToggle = () => {
    if (isAllSelected) {
      handleDeselectAll();
    } else {
      handleSelectAll();
    }
    // Ensure selection mode is active when interacting with this checkbox
    if (!showCheckboxes) {
      setIsSelectionModeActive(true);
    }
  };



  // --- Global Click Listener to Exit Mode ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside of: folder container, selection toggle button, action bar, or confirmation modal
      const isSelectToggle = event.target.closest(".selection-mode-toggle");
      const isActionBar = event.target.closest(".selection-action-bar");
      const isConfirmationModal = event.target.closest(".confirmation-modal");

      if (
        (isSelectMode || isSelectionModeActive) &&
        folderContainerRef.current &&
        !folderContainerRef.current.contains(event.target) &&
        !isSelectToggle &&
        !isActionBar &&
        !isConfirmationModal
      ) {
        handleExitSelectionMode();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSelectMode, isSelectionModeActive, handleExitSelectionMode]);

  // FETCH FOLDERS (No change)
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoading(true);
        const { data } = await Axios({ ...SummaryApi.getFolders });
        if (data?.success) {
          dispatch(setFolders(data?.data));
        }
      } catch (error) {
        console.error("Failed to load folders:", error);
        toast.error("Failed to load folders");
      } finally {
        setLoading(false);
      }
    };
    fetchFolders();
  }, [dispatch]);

  // RENAME (No change)
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
    } catch (error) {
      console.error("Rename failed:", error);
      toast.error("Failed to rename");
    }
  };

  // Trigger delete from 3-dot menu (single)
  const triggerSingleDelete = (folderId) => {
    // Note: We are using setConfirmDelete which holds the IDs to delete
    setConfirmDelete({ open: true, folderId: [folderId] }); // Ensure folderId is an array
  };

  // Trigger bulk delete from top bar
  const triggerBulkDelete = () => {
    if (selectedFolders.size === 0) return;
    setConfirmDelete({ open: true, folderId: Array.from(selectedFolders) }); // Ensure folderId is an array
  };

  const confirmAndDelete = async () => {
    // 1. Get the array of IDs from the confirmation state
    const folderIds = confirmDelete.folderId;
    if (!folderIds || folderIds.length === 0) return;

    const count = folderIds.length;

    // Use a loading toast for the duration of the entire operation
    toast.loading(`Deleting ${count} folder${count > 1 ? "s" : ""}...`, {
      toastId: "delete-loading",
    });

    try {
      // 2. Map the IDs to individual API requests and execute them in parallel
      const results = await Promise.allSettled(
        folderIds.map((id) =>
          Axios({
            // Use the existing single delete API structure for each ID
            ...SummaryApi.deleteFolder(id),
          })
        )
      );

      toast.dismiss("delete-loading");

      // 3. Process the results to count successes and failures
      const failed = results.filter((r) => r.status === "rejected").length;
      const successCount = count - failed;

      if (failed === 0) {
        toast.success(
          `Deleted ${successCount} folder${
            successCount > 1 ? "s" : ""
          } successfully!`
        );
      } else {
        toast.warn(`${successCount} deleted, ${failed} failed to delete.`);
      }

      // 4. Determine which IDs were successfully deleted
      const successfulIds = folderIds.filter(
        (_, index) => results[index].status === "fulfilled"
      );

      // --- UI and State Cleanup (using only successful IDs) ---

      // 5. Update Redux Store (Remove only the successfully deleted items)
      const updatedFolders = originalFolders.filter(
        (f) => !successfulIds.includes(f._id)
      );
      dispatch(setFolders(updatedFolders));

      // 6. Clear selection and exit mode
      handleExitSelectionMode();

      // 7. Update manual order (manualOrderIds logic remains the same, using successfulIds)
      if (manualOrderIds) {
        const newIds = manualOrderIds.filter(
          (id) => !successfulIds.includes(id)
        );
        setManualOrderIds(newIds.length > 0 ? newIds : null);

        if (newIds.length > 0) {
          localStorage.setItem("folderManualOrderIds", JSON.stringify(newIds));
        } else {
          localStorage.removeItem("folderManualOrderIds");
        }
      }
    } catch (error) {
      // This outer catch block primarily handles errors during Promise.allSettled setup, not individual request failures
      toast.dismiss("delete-loading");
      console.error("Critical Delete process failed:", error);
      toast.error("A critical error occurred during the deletion process.");
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
    <div className="p-4" ref={folderContainerRef}>
      <AnimatePresence>
        {showCheckboxes && (
          <motion.div
            // Motion properties for slide-down/slide-up animation
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            // Styling properties: fixed position, gradient background, shadow, high z-index
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-2xl"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
              {/* LEFT SIDE: Exit & Count & Select All Checkbox */}
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Exit/Cancel Button */}
                <button
                  onClick={handleExitSelectionMode}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                  title="Exit Selection Mode"
                >
                  <XCircle size={24} />{" "}
                  {/* Changed to XCircle for visibility */}
                </button>

                {/* Select All Checkbox */}
                <button
                  onClick={handleAllSelectCheckboxToggle}
                  className={`flex items-center justify-center h-8 w-8 rounded-lg border-2 transition-all active:scale-95 shadow-md
                ${
                  isAllSelected
                    ? "bg-white border-white text-blue-600"
                    : isIndeterminate
                    ? "bg-white border-white text-gray-900"
                    : "bg-transparent border-white hover:bg-white/10"
                }`}
                  title={isAllSelected ? "Deselect All" : "Select All"}
                >
                  {isAllSelected ? (
                    <Check size={18} className="text-blue-600" />
                  ) : isIndeterminate ? (
                    <Minus size={18} className="text-gray-900" />
                  ) : (
                    // Empty state
                    <div className="h-4 w-4"></div>
                  )}
                </button>

                {/* Selection Count */}
                <span className="text-sm sm:text-lg font-semibold">
                  {selectedFolders.size} folder
                  {selectedFolders.size !== 1 ? "s" : ""} selected
                </span>
              </div>

              {/* RIGHT SIDE: Action Buttons (Delete) */}
              <div className="flex items-center gap-4">
                {/* Delete Button */}
                <button
                  onClick={triggerBulkDelete} // <-- Changed to the new trigger function
                  disabled={selectedFolders.size === 0}
                  className="flex gap-2 items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50 font-medium"
                  title="Delete Selected Folders"
                >
                  <Trash2 size={20} />
                  <span className="hidden sm:inline">
                    Delete ({selectedFolders.size})
                  </span>
                  <span className="sm:hidden">Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

          {/* Selection Mode Toggle Button (The main Check button) */}
          <button
            onClick={handleToggleSelectionMode}
            className={`selection-mode-toggle p-3 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center
							${
                showCheckboxes
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }
						`}
            title={
              showCheckboxes
                ? "Deselect All & Exit Selection Mode"
                : "Enter Selection Mode"
            }
          >
            <Check size={20} className={isSelectMode ? "" : "opacity-50"} />
          </button>

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

      <h2
        className={`text-2xl font-bold mb-6 flex items-center gap-3 
           dark:text-white dark:text-gray-800
    `}
      >
        <FolderIcon className="text-orange-500" />
        My Folders
        <span className="text-sm font-normal text-gray-400 ">
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
          <div className=" grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {displayFolders.length === 0 ? (
              <div className="absolute inset-0 flex items-center ">
                <div className="w-full py-16 flex flex-col items-center justify-center">
                  <FolderIcon size={50} className="text-gray-400" />
                  <p className="text-gray-500 mt-3 text-sm">No folders found</p>
                </div>
              </div>
            ) : (
              displayFolders.map((folder) => {
                const isSelected = selectedFolders.has(folder._id);

                return (
                  <SortableFolderItem key={folder._id} folder={folder}>
                    <div
                      // Single-click handles both navigation and selection toggle
                      onClick={() => handleCardClick(folder._id)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleCardDoubleClick(folder._id, e);
                      }}
                      className={`group relative flex flex-col items-center justify-center p-6 border rounded-2xl shadow-md transition-all duration-300 cursor-pointer
										${
                      showCheckboxes
                        ? "hover:shadow-lg scale-[1.01] hover:bg-opacity-95"
                        : "hover:shadow-xl hover:-translate-y-2"
                    }
										${
                      isSelected
                        ? "ring-4 ring-blue-500 scale-[1.03] shadow-2xl border-blue-500" // Selected style
                        : isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }
									`}
                    >
                      {/* Checkbox visibility based on combined state: showCheckboxes */}
                      {showCheckboxes && (
                        <div
                          className={`absolute top-3 left-3 z-30 w-6 h-6 rounded-full border-2 transition 
											${
                        isSelected
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white border-gray-400 dark:bg-gray-900"
                      }
											flex items-center justify-center shadow-md cursor-pointer
										`}
                          // Clicks on the actual checkmark still toggle selection
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelection(folder._id); // Use the direct toggle handler
                          }}
                        >
                          {isSelected && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                      )}

                      <div className="bg-orange-100 text-orange-600 p-6 rounded-full group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
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
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p
                            className={`text-sm font-medium truncate transition
												${showCheckboxes ? "" : "group-hover:text-orange-500"}
												${isDark ? "text-gray-300" : "text-gray-700"}`}
                          >
                            {folder.name || "Untitled"}
                          </p>
                        )}
                      </div>

                      <div
                        className={`absolute top-3 right-3 flex gap-2 transition-all duration-200 
										${
                      editingFolderId === folder._id || showCheckboxes
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                      >
                        {editingFolderId === folder._id ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRename(folder._id);
                              }}
                              className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 shadow-lg"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolderId(null);
                              }}
                              className="bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600 shadow-lg"
                              title="Cancel Edit"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Hide actions when in selection mode is active */}
                            {!showCheckboxes && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingFolderId(folder._id);
                                    setNewFolderName(folder.name);
                                  }}
                                  className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-lg"
                                  title="Rename"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // This now calls the trigger function
                                    triggerSingleDelete(folder._id);
                                  }}
                                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </SortableFolderItem>
                );
              })
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDelete.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 confirmation-modal">
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
              {Array.isArray(confirmDelete.folderId)
                ? `Delete ${confirmDelete.folderId.length} Folders?`
                : "Delete Folder?"}
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
                onClick={confirmAndDelete} // <-- Changed to the new function name, which uses IDs from state
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
