import folder from "../models/Folder.js";
import File from "../models/File.js";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/userModel.js";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const CreateFolder = async (req, res) => {
  try {
    const { folderName } = req.body;
    const { userId } = req.userId;
    if (!folderName)
      return res.status(400).json({
        message: "folder name is required",
        error: true,
        success: false,
      });

    const existFolder = await folder.findOne({
      name: folderName,
      createdBy: userId,
    });

    if (existFolder)
      return res.status(400).json({
        message: "Folder already exist",
        error: true,
        success: false,
      });

    const newFolder = await folder.create({
      name: folderName,
      createdBy: userId,
    });

    return res.status(200).json({
      message: "Folder created",
      success: true,
      error: false,
      data: newFolder,
    });
  } catch (error) {
    return res.status(500).json({
      message: error?.message || "internal server",
      error: true,
      success: false,
    });
  }
};

// export const CreateFolder = async (req, res) => {
//   try {
//     const { folderName } = req.body;
//     const { userId } = req.userId;

//     if (!folderName) {
//       return res.status(400).json({
//         message: "Folder name is required",
//         error: true,
//         success: false,
//       });
//     }
// console.log("folder",userId);

//     const existFolder = await folder.findOne({
//       name: folderName,
//       createdBy: userId,
//     });

//     if (existFolder) {
     
//       return res.status(409).json({
//         message: "Folder already exists for this user.",
//         error: true,
//         success: false,
//       });
//     }


//     const newFolder = await folder.create({
//       name: folderName,
//       createdBy: userId,
//     });

//     return res.status(201).json({
//       // Use 201 Created for resource creation
//       message: "Folder created successfully",
//       success: true,
//       error: false,
//       data: newFolder,
//     });
//   } catch (error) {
   
//     if (error.code === 11000) {
    
//       return res.status(409).json({
//         message: "A folder with this name already exists (",
//         error: true,
//         success: false,
//       });
//     }

//     console.error("Folder creation failed:", error);
//     return res.status(500).json({
//       message: error?.message || "Internal Server Error",
//       error: true,
//       success: false,
//     });
//   }
// };

export const getAllFolder = async (req, res) => {
  try {
    const { userId } = req.userId;
    const AllFolder = await folder
      .find({ createdBy: userId })
      .populate("files")
      .sort({ createdAt: -1 });

    return res.status(201).json({
      message: "fetch All folder",
      error: false,
      success: true,
      data: AllFolder,
    });
  } catch (error) {
    return res.status(401).json({
      message: "server Error",
      error: true,
      success: false,
    });
  }
};

export const getFilesInFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.userId;

    const matchFolder = await folder.findOne({ _id: id, createdBy: userId });
    if (!matchFolder)
      return res.status(402).json({
        message: "folder not found",
        error: true,
        success: false,
      });

    const matchFile = await File.find({ folder: id, uploadedBy: userId }).sort({
      createdAt: -1,
    });
    if (!matchFile)
      return res.status(401).json({
        message: "file not exist ",
        error: true,
        success: false,
      });

    return res.status(200).json({
      message: "file fetch Successfully",
      error: false,
      success: true,
      data: matchFile,
    });
  } catch (error) {
    return res.status(501).json({
      message: "internal Server",
      error: true,
      success: false,
    });
  }
};

export const getSelectedFolders = async (req, res) => {
  try {
    const { userId } = req.userId; // ✅ not destructured
    console.log("UserId:", userId);

    const user = await User.findById(userId).select("selectedFolders");
    console.log("User found:", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        folderIds: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Selected folders fetched successfully",
      folderIds: user.selectedFolders || [],
    });
  } catch (error) {
    console.error("Error in getSelectedFolders:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching selected folders",
      folderIds: [],
    });
  }
};

export const uploadFileOnFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.userId;

    const Folder = await folder.findOne({ _id: id, createdBy: userId });
    if (!Folder) {
      return res.status(401).json({
        message: "Folder not found or unauthorized",
        error: true,
        success: false,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No file selected",
        error: true,
        success: false,
      });
    }
    // const file=await File.findOne({name:req.file.name})
    // if(file) return res.status(405).json({
    //   message:"File already exist",
    //   error:true,
    //   success:false
    // })
    const newFile = await File.create({
      name: req.file.originalname,
      url: req.file.path,
      public_id: req.file.filename || req.file.public_id, // 🔥 Important
      folder: id,
      uploadedBy: userId,
    });

    Folder.files.push(newFile._id);
    await Folder.save();

    console.log("newFile", newFile);

    return res.status(200).json({
      message: "File uploaded successfully",
      error: false,
      success: true,
      data: newFile,
    });
  } catch (error) {
    console.error(" Upload error:", error);

    try {
      if (req.file?.path) {
        let publicId = req.file.filename || req.file.public_id;

        // extract manually if not present
        if (!publicId && req.file.path) {
          publicId = req.file.path
            .split("/upload/")[1]
            ?.split(".")[0]
            ?.replace(/^v\d+\//, "");
        }

        if (publicId) {
          const cloudRes = await cloudinary.uploader.destroy(publicId);
          console.log(" Cloudinary cleanup:", cloudRes);
        }
      }
    } catch (cleanupError) {
      console.warn(" Cleanup failed:", cleanupError.message);
    }

    return res.status(500).json({
      message: "File upload failed",
      error: true,
      success: false,
    });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.userId;

    // Step 1: Verify folder ownership
    const Folder = await folder.findOne({ _id: id, createdBy: userId });
    if (!Folder) {
      return res.status(401).json({
        message: "Folder not found or unauthorized",
        error: true,
        success: false,
      });
    }

    // Step 2: Get all files from the folder
    const files = await File.find({ folder: id });

    let deletedCount = 0;
    let failedCount = 0;

    // Step 3: Delete each file from Cloudinary
    for (const file of files) {
      try {
        let publicId = file.public_id;

        // Extract manually if missing
        if (!publicId && file.url) {
          const parts = file.url.split("/upload/")[1];
          if (parts) publicId = parts.split(".")[0].replace(/^v\d+\//, "");
        }

        if (!publicId) {
          console.warn(`⚠️ No public_id found for file: ${file.name}`);
          continue;
        }

        // ✅ Detect resource type by extension
        const ext = file.name.split(".").pop().toLowerCase();
        let resourceType = "image";
        if (["mp4", "mov", "avi", "mkv"].includes(ext)) resourceType = "video";
        else if (["pdf", "zip", "doc", "docx", "txt"].includes(ext))
          resourceType = "raw";

        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        });

        if (result.result === "ok") {
          console.log(`✅ Deleted from Cloudinary: ${file.name}`);
          deletedCount++;
        } else {
          console.warn(`⚠️ Failed to delete from Cloudinary: ${file.name}`);
          failedCount++;
        }
      } catch (err) {
        console.error(
          `❌ Cloudinary delete error for ${file.name}:`,
          err.message
        );
        failedCount++;
      }
    }

    // Step 4: Delete all files from DB
    await File.deleteMany({ folder: id });

    // Step 5: Delete folder from DB
    await folder.findByIdAndDelete(id);

    return res.status(200).json({
      message: `Folder deleted successfully. ${deletedCount} files removed from Cloudinary, ${failedCount} failed.`,
      success: true,
    });
  } catch (error) {
    console.error("❌ Folder delete error:", error);
    return res.status(500).json({
      message: "Failed to delete folder.",
      error: error.message,
      success: false,
    });
  }
};

export const renameFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.userId;
    const { newName } = req.body;

    const SelectFolder = await folder.findByIdAndUpdate(
      { _id: id, createdBy: userId },
      {
        name: newName,
      },
      { new: true }
    );

    return res.status(201).json({
      message: "folder Rename",
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(501).json({
      message: error || error.message || "folder Rename failed",
      error: true,
      success: false,
    });
  }
};

export const getFolder = async (req, res) => {
  const { id } = req.params;

  const { userId } = req.userId;

  const Folder = await folder.findOne({ _id: id, createdBy: userId });

  if (!Folder)
    return res.status(400).json({
      message: "FOlder not exist",
      error: true,
      success: false,
    });

  return res.status(201).json({
    message: "Folder Successfully fetched",
    error: false,
    success: true,
    data: Folder,
  });
};

export const renameFile = async (req, res) => {
  try {
    const { id } = req.params; // file ID
    const { newFileName } = req.body;

    if (!newFileName || newFileName.trim() === "") {
      return res
        .status(400)
        .json({ success: false, error: true, message: "New name is required" });
    }

    const updatedFile = await File.findByIdAndUpdate(
      { _id: id },
      { name: newFileName.trim() },
      { new: true }
    );

    if (!updatedFile)
      return res
        .status(404)
        .json({ success: false, message: "File not found" });

    return res.status(200).json({
      success: true,
      error: false,
      message: "File renamed successfully",
      data: updatedFile,
    });
  } catch (error) {
    console.error("Rename File Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while renaming file" });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.userId;

    const file = await File.findOne({ _id: id, uploadedBy: userId });
    if (!file) {
      return res.status(404).json({
        message: "File not found in database",
        success: false,
      });
    }

    const fileExtension = file.name.split(".").pop().toLowerCase();
    let resourceType = "image"; // default

    if (["mp4", "webm", "ogg"].includes(fileExtension)) {
      resourceType = "video";
    } else if (
      ["pdf", "txt", "doc", "docx", "zip", "rar"].includes(fileExtension)
    ) {
      resourceType = "raw";
    }

    // ✅ Get public_id
    let publicId = file.public_id;
    if (!publicId && file.url) {
      publicId = file.url
        .split("/upload/")[1]
        ?.split(".")[0]
        ?.replace(/^v\d+\//, ""); // remove version part like v12345/
    }

    if (publicId) {
      // ✅ Delete from Cloudinary according to file type
      const cloudRes = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      console.log(`Deleted ${resourceType} from Cloudinary:`, cloudRes);
    }

    // ✅ Delete from MongoDB
    await File.findByIdAndDelete(id);

    res.status(200).json({
      message: "File deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("❌ Delete file error:", error);
    res.status(500).json({
      message: "Error deleting file",
      success: false,
      error: error.message,
    });
  }
};
