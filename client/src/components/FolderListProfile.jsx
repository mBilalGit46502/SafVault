import React, { useEffect, useState } from "react";
import { FolderIcon, CheckSquare, Square } from "lucide-react";
import Axios from "../api/Axios";
import SummaryApi from "../api/SummaryApi";
import { toast } from "react-toastify";

export default function FolderListProfile() {
  const [folderList, setFolderList] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const allSelected =
    folderList.length > 0 && selectedFolders.length === folderList.length;

  const loadFolders = async () => {
    setLoading(true);
    try {
      const [foldersRes, selectedRes] = await Promise.all([
        Axios({ ...SummaryApi.getFolders }),
        Axios({ ...SummaryApi.getSelectedFolders }),
      ]);

      console.log(foldersRes);

      if (foldersRes.data?.success) {
        setFolderList(foldersRes.data.data || []);
      } else toast.error(foldersRes.data?.message || "Failed to load folders");
      console.log("selectedFOlder", selectedFolders);

      if (selectedRes?.data?.success) {
        setSelectedFolders(selectedRes.data.folderIds || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading folders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const updateSelection = async (updatedSelection, message) => {
    setSaving(true);
    try {
      const { data } = await Axios({
        ...SummaryApi.selectFolders,
        data: { folderIds: updatedSelection },
      });

      if (data?.success) {
        setSelectedFolders(updatedSelection);
        if (message) toast.success(message);
      } else {
        toast.error(data?.message || "Failed to update selection");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update folder selection");
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = async (folderId) => {
    const updatedSelection = selectedFolders.includes(folderId)
      ? selectedFolders.filter((id) => id !== folderId)
      : [...selectedFolders, folderId];

    await updateSelection(
      updatedSelection,
      selectedFolders.includes(folderId)
        ? "Folder unselected"
        : "Folder selected"
    );
  };

  const handleSelectAll = async () => {
    const updatedSelection = allSelected ? [] : folderList.map((f) => f._id);
    await updateSelection(
      updatedSelection,
      allSelected ? "All folders unselected" : "All folders selected"
    );
  };

  if (loading)
    return (
      <p className="text-center text-gray-400 py-3 animate-pulse">
        Loading folders...
      </p>
    );

  return (
    <div className="w-full bg-white shadow-md rounded-xl p-4 transition-all">
      <div className="flex justify-between items-center mb-3 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <FolderIcon className="text-orange-500" size={20} />
          Folders
        </h2>

        <button
          onClick={handleSelectAll}
          disabled={saving}
          className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-orange-600 transition disabled:opacity-50"
        >
          {allSelected ? (
            <CheckSquare size={18} className="text-orange-500" />
          ) : (
            <Square size={18} className="text-gray-400" />
          )}
          {allSelected ? "Unselect All" : "Select All"}
        </button>
      </div>

      {/* Folder List */}
      <div className="space-y-2">
        {folderList.length > 0 ? (
          folderList.map((folder) => {
            const isSelected = selectedFolders.includes(folder._id);
            return (
              <div
                key={folder._id}
                onClick={() => handleSelect(folder._id)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition-all duration-200 ${
                  isSelected
                    ? "bg-orange-50 border-orange-400"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                  <FolderIcon
                    size={22}
                    className={`transition-colors ${
                      isSelected ? "text-orange-500" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-orange-600" : "text-gray-700"
                    }`}
                  >
                    {folder?.name || "Untitled"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-400 text-sm py-3">
            No folders found
          </p>
        )}
      </div>
    </div>
  );
}
