import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../storeSlices/userSlice";
import folderSlice from "../storeSlices/folderSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    folder:folderSlice
  },
});

export default store;
