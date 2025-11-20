import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import TokenLog from "../models/TokenLogModel.js";
import { encryptData } from "../utils/encryption.js";
import folder from "../models/Folder.js";
import File from "../models/File.js";
import AuditLog from "../models/RecordAuditModel.js";

// Login using another user's token
export const LoginWithToken = async (req, res) => {
  try {
    const { email, token, deviceName } = req.body;

    // 1️⃣ Check if email is valid
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Email is invalid or not registered",
        error: true,
        success: false,
      });
    }
    const hashToken = encryptData(token, process.env.JWT_TOKEN_SECRETE);
    console.log("hashToken", hashToken);
    const sameUser = await User.findOne({ email, token_code: hashToken });
    // 2️⃣ Verify the token belongs to some other user

    if (sameUser) {
      return res.status(502).json({
        message: "You are the owner of the key",
        error: true,
        success: false,
      });
    }

    let decoded;

    try {
      decoded = await User.findOne({ token_code: hashToken });
      console.log("decoded", decoded);
    } catch (err) {
      return res.status(403).json({
        message: "Invalid or expired token",
        error: true,
        success: false,
      });
    }

    const mainUserId = decoded?._id; // whoever generated the token
    console.log("mainUserId", mainUserId);

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;

    console.log("Detected IP:", ip);

    // 3️⃣ Create a pending access request log
    const tokenLog = await TokenLog.create({
      linkedUser: mainUserId,
      LoginUser: user._id,
      ip: ip,
      userAgent: req.headers["user-agent"],
      deviceName: deviceName || "Unknown Device",
      isApproved: false, // wait until main user approves
    });

    // 4️⃣ Generate short-lived access token (valid for 10 minutes)
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_TOKEN_SECRETE,
      { expiresIn: "10m" }
    );
    const cookiesOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 60 * 60 * 1000,
    };
    res.cookie("tokenLogin", accessToken, cookiesOption);

    return res.status(200).json({
      message:
        "Access request created. Please wait for approval by the main account owner.",
      accessToken, // temporary token for 10 min
      tokenLogId: tokenLog._id,
      LoginUser: user._id,
      mainUserId,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error during token login",
      error: true,
      success: false,
    });
  }
};

export const GetPendingDevice = async (req, res) => {
  try {
    const { userId } = req.userId; // ✅ Correctly read from middleware
    console.log(userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access — userId not found in token",
      });
    }

    // const UserLogin = await TokenLog.findOne({ linkedUser: userId }).populate(
    //   "LoginUser",
    //   "email username"
    // );

    // console.log(UserLogin);

    // ✅ Find all pending devices for this user's token
    const pendingDevices = await TokenLog.find({
      linkedUser: userId,
      isApproved: false,
    })
      .populate({
        path: "linkedUser",
        select: "username email avatar", // ✅ Only return needed fields
      })
      .populate({
        path: "LoginUser",
        select: "username email avatar",
      })
      .sort({ requestedAt: -1 }) // ✅ Optional: show newest first
      .lean(); // ✅ Returns plain JS object for better performance

    console.log("Pending Devices:", pendingDevices);

    if (!pendingDevices || pendingDevices.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No pending device approvals found",
        data: [],
      });
    }

    console.log("Pending devices:", pendingDevices.length);

    return res.status(200).json({
      success: true,
      message: "Pending devices fetched successfully",
      count: pendingDevices.length,
      data: pendingDevices,
    });
  } catch (error) {
    console.error("Error fetching device status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching device status",
      error: error.message,
    });
  }
};

// 🟢 Approve or Reject Device
export const updateDeviceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "approve" or "reject"
    const { userId } = req.userId;

    const device = await TokenLog.findById(id).populate(
      "linkedUser",
      "email username"
    );

    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    if (action === "approve") {
      device.isApproved = true;
      device.approvedAt = new Date();
      device.approvedBy = userId;
      await device.save();

      return res.status(200).json({
        success: true,
        message: `Device approved for ${device.linkedUser.username}`,
      });
    } else if (action === "reject") {
      await TokenLog.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: `Device rejected and removed`,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update device status",
      error: error.message,
    });
  }
};

export const GetUpdateDevice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in.",
      });
    }

    // ✅ Fetch all devices linked to this user (approved or pending)
    const devices = await TokenLog.find({
      $or: [{ linkedUser: id }, { approvedBy: id }],
    })
      .populate("linkedUser", "username email avatar")
      .sort({ requestedAt: -1 });

    if (!devices || devices.length === 0) {
      // ❌ Device record deleted → rejected
      return res.status(404).json({
        success: false,
        message: "Device request not found or has been rejected.",
      });
    }

    const approvedDevices = devices.filter((d) => d.isApproved === true);
    const pendingDevices = devices.filter((d) => d.isApproved === false);

    // ✅ Still pending
    if (pendingDevices.length > 0 && approvedDevices.length === 0) {
      return res.status(402).json({
        success: true,
        message: "Device still pending approval.",
        data: pendingDevices,
      });
    }

    // ✅ Approved
    if (approvedDevices.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Device approved successfully.",
        data: approvedDevices,
      });
    }

    // ❌ Safety fallback — no matching record
    return res.status(404).json({
      success: false,
      message: "Device not found or rejected.",
    });
  } catch (error) {
    console.error("Error in GetUpdateDevice:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching device info.",
      // error: error.message,
    });
  }
};

export const UserLogoutAndRemove = async (req, res) => {
  try {
    const { userId } = req.userId; // ✅ no need to destructure { userId } again

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // ✅ Delete all token logs for this user
    const deletedLogs = await TokenLog.deleteMany({ LoginUser: userId });

    // ✅ Optional: clear JWT token cookie (if you use one)
    res.clearCookie("tokenLogin");

    return res.status(200).json({
      success: true,
      message: `Logout successful. ${deletedLogs.deletedCount} session(s) removed.`,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while logging out.",
      error: error.message,
    });
  }
};

export const GetApprovedDevice = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in.",
      });
    }

    // ✅ Fetch only devices approved by this specific user
    const approvedDevices = await TokenLog.find({
      approvedBy: userId,
      isApproved: true,
    })
      .populate({
        path: "linkedUser",
        select: "username email avatar", // ✅ Only return needed fields
      })
      .populate({
        path: "LoginUser",
        select: "username email avatar",
      })
      .sort({ requestedAt: -1 }) // ✅ Optional: show newest first
      .lean(); // ✅ Returns plain JS object for better performance

    console.log("approved", approvedDevices);

    // if (!approvedDevices.length) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No approved devices found for your account.",
    //   });
    // }

    // ✅ Success
    return res.status(200).json({
      success: true,
      message: "Approved devices fetched successfully.",
      data: approvedDevices,
    });
  } catch (error) {
    console.error("Error in UpdateDevice:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching approved devices.",
      error: error.message,
    });
  }
};

// controllers/deviceController.js
export const ForceLogout = async (req, res) => {
  try {
    const { id } = req.params;
    await TokenLog.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Device logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to force logout device",
      error: error.message,
    });
  }
};

export const GetUserById = async (req, res) => {
  try {
    // ✅ Extract userId from req.user (set by middleware after verifying JWT)
    const { userId } = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing user ID",
      });
    }

    // ✅ Check if the token/device still exists (not forced logged out)
    const loginSession = await TokenLog.findOne({ LoginUser: userId });

    if (!loginSession) {
      // 🔹 This means user was force logged out or token removed
      return res.status(403).json({
        success: false,
        message: "Session invalid or device removed by admin",
      });
    }

    // ✅ Check if user exists in DB
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or deleted by admin",
      });
    }

    // ✅ All good — session is valid
    return res.status(200).json({
      success: true,
      message: "User session verified successfully",
      user,
      session: loginSession,
    });
  } catch (error) {
    console.error("Error in GetUserById:", error.message);

    // 🔹 Handle JWT expiration (if using middleware)
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// export const updateSelectedFolders = async (req, res) => {
//   try {
//     console.log("Incoming body:", req.body); // 👀 Log to check what arrives

//     const folderIds = req.body?.folderIds;
//     const { userId } = req.userId;

//     if (!folderIds || !Array.isArray(folderIds)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid folder IDs. Expecting an array.",
//       });
//     }

//     const selectedFolder = await User.findByIdAndUpdate(userId, {
//       selectedFolders: folderIds,
//     });
//     const updated = await TokenLog.findOneAndUpdate(
//       { linkedUser: userId },
//       { selectedFolders: folderIds },
//       { new: true }
//     ).populate("selectedFolders", "name");

//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: "TokenLog not found for this user",
//       });
//     }

//     res.json({
//       success: true,
//       message: "Selected folders updated successfully",
//       data: updated.selectedFolders,
//     });
//   } catch (error) {
//     console.error("Error updating folders:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while updating folders",
//     });
//   }
// };

export const updateSelectedFolders = async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    const folderIds = req.body?.folderIds;

    const { userId } = req.userId; // Use directly if it's the ID string

    if (!folderIds || !Array.isArray(folderIds)) {
      return res.status(400).json({
        success: false,
        message: "Invalid folder IDs. Expecting an array of IDs.",
      });
    }

    const selectedFolder = await User.findByIdAndUpdate(
      userId,
      { $set: { selectedFolders: folderIds } }, // Use $set for clarity
      { new: true }
    );

    if (!selectedFolder) {
      return res.status(404).json({
        success: false,
        message: "User not found. Cannot save selected folders.",
      });
    }

    const updatedTokenLog = await TokenLog.findOneAndUpdate(
      { linkedUser: userId },
      { $set: { selectedFolders: folderIds } },
      { new: true }
    ).populate("selectedFolders", "name");

    let responseData = updatedTokenLog ? updatedTokenLog.selectedFolders : [];
    let logMessage = updatedTokenLog
      ? "Selected folders updated in User and TokenLog."
      : "Selected folders updated in User. TokenLog not found (and not updated).";

    res.json({
      success: true,
      message: logMessage,

      data: responseData,
    });
  } catch (error) {
    console.error("Error updating folders:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating folders",
    });
  }
};

export const GetUpdateTokenFolder = async (req, res) => {
  try {
    const { userId } = req.userId; // ✅ From auth middleware (decoded JWT)
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });

    // ✅ Step 1: Verify token user exists and is approved
    const tokenSession = await TokenLog.findOne({ LoginUser: userId }).populate(
      "linkedUser",
      "username email"
    );

    if (!tokenSession)
      return res.status(403).json({
        success: false,
        message: "Token session not found. Please login again.",
      });

    if (!tokenSession.isApproved)
      return res.status(403).json({
        success: false,
        message: "Access not approved yet by owner.",
      });

    // ✅ Step 2: Get linked owner's user ID
    const ownerId = tokenSession.linkedUser._id;

    // ✅ Step 3: Fetch the selected folders of the owner
    const owner = await User.findById(ownerId).select("selectedFolders");
    if (!owner)
      return res.status(404).json({
        success: false,
        message: "Linked user not found",
      });

    const selectedFolderIds = owner.selectedFolders || [];

    // ✅ Step 4: Get all folders + files
    const folders = await folder
      .find({ _id: { $in: selectedFolderIds } })
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    // ✅ Step 5: Get all files belonging to those folders
    const files = await File.find({ folder: { $in: selectedFolderIds } })
      .populate("uploadedBy", "username email")
      .sort({ createdAt: -1 });

    // ✅ Step 6: Group files by folder (for UX)
    const grouped = folders.map((folder) => ({
      folderId: folder._id,
      folderName: folder.name,
      totalFiles: files.filter(
        (f) => f.folder.toString() === folder._id.toString()
      ).length,
      files: files
        .filter((f) => f.folder.toString() === folder._id.toString())
        .map((file) => ({
          fileId: file._id,
          name: file.name,
          url: file.url,
          uploadedBy: file.uploadedBy?.username,
          uploadedAt: file.createdAt,
        })),
    }));

    // ✅ Step 7: Return response
    return res.status(200).json({
      success: true,
      message: "Fetched token user folders & files successfully",
      linkedOwner: {
        id: ownerId,
        username: tokenSession.linkedUser.username,
        email: tokenSession.linkedUser.email,
      },
      data: grouped,
    });
  } catch (error) {
    console.error("Error in GetUpdateTokenFolder:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching token user data",
      error: error.message,
    });
  }
};

export const recordAuditLog = async (req, res) => {
  const { userId } = req.userId;

  const { action, description, metadata = {} } = req.body;

  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress || "N/A";

  if (!userId || !action || !description) {
    return res.status(400).json({
      message: "Missing required fields: User ID, action type, or description.",
      error: true,
      success: false,
    });
  }

  try {
    const logEntry = await AuditLog.create({
      user: userId,
      actionType: action,
      description: description,
      ipAddress: metadata.ipAddress || ipAddress,
      metadata: metadata,
      timestamp: new Date(),
    });

    if (logEntry) {
      return res.status(201).json({
        message: "Audit Log successfully recorded.",
        error: false,
        success: true,
        logId: logEntry._id,
      });
    } else {
      return res.status(500).json({
        message: "Audit Log failed to save to database.",
        error: true,
        success: false,
      });
    }
  } catch (err) {
    console.error("Internal server error during audit logging:", err.message);
    return res.status(500).json({
      message: "Internal Server Error during audit log operation.",
      error: true,
      success: false,
    });
  }
};

export const getAuditLogs = async (req, res) => {
  const { userId } = req.userId;

  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized: User ID missing.",
      error: true,
      success: false,
    });
  }

  try {
    const logs = await AuditLog.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .select("-__v");

    return res.status(200).json({
      message: "Audit logs retrieved successfully.",
      error: false,
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error.message);
    return res.status(500).json({
      message: "Internal Server Error while fetching logs.",
      error: true,
      success: false,
    });
  }
};
