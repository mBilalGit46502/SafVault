import { createSlice } from "@reduxjs/toolkit";

const folderSlice = createSlice({
  name: "folder",
  initialState: {
    folders: [],
    currentFolder: null,
  },
  reducers: {
    setFolders: (state, action) => {
      state.folders = action.payload;
    },
    createFolder: (state, action) => {
      state.folders.push(action.payload); // only push folder object
    },
    setCurrentFolder: (state, action) => {
      state.currentFolder = action.payload;
    },
    addFileToFolder: (state, action) => {
      const { folderId, file } = action.payload;
      const folder = state.folders.find((f) => f._id === folderId);
      if (folder) folder.files.push(file);
    },
    deleteFolder: (state, action) => {
      state.folders = state.folders.filter((f) => f._id !== action.payload);
    },
  },
});

export const {
  setFolders,
  createFolder,
  setCurrentFolder,
  addFileToFolder,
  deleteFolder,
} = folderSlice.actions;

export default folderSlice.reducer;
