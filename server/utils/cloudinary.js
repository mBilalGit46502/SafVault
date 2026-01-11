import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRETE,
});

// --- Allowed file extensions ---
const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|docx|mp4|zip|webm|ogg|wav|mp3|mov|avi|mkv/;

// --- File Filter ---
const fileFilter = (req, file, cb) => {
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  const mimeTypes = [
    "image/jpeg", "image/jpg", "image/png", "image/gif",
    "application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo", "video/x-matroska",
    "audio/ogg", "audio/wav", "audio/mpeg"
  ];

  if (extName && mimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only allowed file formats (images, videos, docs, zips)."));
  }
};

// --- Cloudinary Storage ---
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const name = path.parse(file.originalname).name;
    const safeName = name.replace(/\s+/g, "_");

    let resourceType = "auto";
    const ext = path.extname(file.originalname).toLowerCase();

    if ([".pdf", ".txt", ".zip", ".docx"].includes(ext)) {
      resourceType = "raw";
    } else if ([".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"].includes(ext)) {
      resourceType = "video";
    } else {
      resourceType = "image";
    }

    return {
      folder: "privacyApp",
      public_id: `${Date.now()}-${safeName}`,
      resource_type: resourceType,
    };
  },
});

// --- Multer Upload ---
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 50MB max
  },
});

export default upload;
