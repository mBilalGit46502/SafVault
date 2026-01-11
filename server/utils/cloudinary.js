‎import { v2 as cloudinary } from "cloudinary";
‎import { CloudinaryStorage } from "multer-storage-cloudinary";
‎import multer from "multer";
‎import path from "path";
‎
‎cloudinary.config({
‎  cloud_name: process.env.CLOUDINARY_NAME,
‎  api_key: process.env.CLOUDINARY_KEY,
‎  api_secret: process.env.CLOUDINARY_SECRETE,
‎});
‎
‎const allowedTypes =
‎  /jpeg|jpg|png|gif|pdf|txt|docx|mp4|zip|webm|ogg|wav|mp3|mov|avi|mkv/;
‎
‎const fileFilter = (req, file, cb) => {
‎  const extName = allowedTypes.test(
‎    path.extname(file.originalname).toLowerCase()
‎  );
‎  const mimeType = allowedTypes.test(file.mimetype);
‎  if (extName && mimeType) {
‎    cb(null, true);
‎  } else {
‎    cb(new Error(" Only allowed file formats (images, videos, docs, zips)."));
‎  }
‎};
‎
‎const storage = new CloudinaryStorage({
‎  cloudinary,
‎  params: async (req, file) => {
‎    const name = path.parse(file.originalname).name;
‎    const safeName = name.replace(/\s+/g, "_");
‎
‎    let resourceType = "auto";
‎    const ext = path.extname(file.originalname).toLowerCase();
‎
‎    if ([".pdf", ".txt", ".zip", ".docx"].includes(ext)) {
‎      resourceType = "raw";
‎    } else if (
‎      [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"].includes(ext)
‎    ) {
‎      resourceType = "video";
‎    } else {
‎      resourceType = "image";
‎    }
‎
‎    return {
‎      folder: "privacyApp",
‎      public_id: `${Date.now()}-${safeName}`,
‎      resource_type: resourceType, 
‎    };
‎  },
‎});
‎
‎const upload = multer({
‎  storage,
‎  fileFilter,
‎});
‎
‎export default upload;
‎
