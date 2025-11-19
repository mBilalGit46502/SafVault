import express from "express";
import { CreateFolder, deleteFile, deleteFolder, getAllFolder, getFilesInFolder, getFolder, getSelectedFolders, renameFile, renameFolder, uploadFileOnFolder } from "../controllers/uploadController.js";
import { authUser } from "../middleware/authUser.js";
import upload from "../utils/cloudinary.js"

const router = express.Router();

router.post("/folder",authUser, CreateFolder);
router.get("/folders",authUser, getAllFolder);
router.get("/folder/getSelectedFolders", authUser, getSelectedFolders);
router.get("/folders/:id/files",authUser, getFilesInFolder);
router.post("/folders/:id/file",authUser,upload.single("file"), uploadFileOnFolder);
router.get("/folder/:id",authUser, getFolder);
router.delete("/folders/:id",authUser, deleteFolder);
router.put("/folders/:id",authUser, renameFolder);
router.delete("/folder/file/:id",authUser, deleteFile);
router.put("/folder/file/:id",authUser, renameFile);

export default router;
