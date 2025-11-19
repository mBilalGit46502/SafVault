import React, { useState, useEffect } from "react";
import { PlusCircle, Folder as FolderIcon } from "lucide-react";
import FolderInput from "../components/FolderInput";
import { useNavigate } from "react-router-dom";
import Axios from "../api/Axios";
import { toast } from "react-toastify";

function FolderList() {
  const [folders, setFolders] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const { data } = await Axios.get("/api/folders");
        setFolders(data.data);
      } catch (error) {
        toast.error("Failed to fetch folders");
      }
    };
    fetchFolders();
  }, []);

  return (
    <div className="p-5">
           {" "}
      <div className="flex justify-between items-center mb-5">
               {" "}
        <h2 className="text-xl font-bold text-gray-800">📁 Your Folders</h2>   
           {" "}
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow"
        >
                    <PlusCircle size={20} /> New Folder        {" "}
        </button>
             {" "}
      </div>
           {" "}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {" "}
        {folders.map((folder) => (
          <div
            key={folder._id}
            className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-xl shadow hover:bg-gray-200 cursor-pointer"
            onClick={() => navigate(`/folder/${folder._id}`)}
          >
                        <FolderIcon size={45} className="text-orange-600" />   
                   {" "}
            <p className="mt-2 font-medium text-gray-700">{folder.name}</p>     
               {" "}
          </div>
        ))}
             {" "}
      </div>
            {showInput && <FolderInput onClose={() => setShowInput(false)} />} 
       {" "}
    </div>
  );
}

export default FolderList;
