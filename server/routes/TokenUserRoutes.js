import express from "express"
import {
  LoginWithToken,
  GetPendingDevice,
  GetUpdateDevice,
  updateDeviceStatus,
  UserLogoutAndRemove,
  GetApprovedDevice,
  ForceLogout,
  GetUserById,
  updateSelectedFolders,
  GetUpdateTokenFolder,
  recordAuditLog,
  getAuditLogs,
} from "../controllers/TokenUserControllers.js";
import { TokenAuthUser } from "../middleware/TokenAuthUser.js";
import { authUser } from "../middleware/authUser.js";
import { tokenLoginLimiter } from "../middleware/LoginRateLimits.js";

const tokenRouter= express.Router()

tokenRouter.post("/user-login", LoginWithToken);
tokenRouter.get("/device/pending", authUser, GetPendingDevice);
tokenRouter.post("/device/:id",authUser, updateDeviceStatus);
tokenRouter.get("/device/:id/approved", GetUpdateDevice);
tokenRouter.delete("/device/remove",TokenAuthUser, UserLogoutAndRemove);
tokenRouter.get("/device/approved",authUser, GetApprovedDevice);
tokenRouter.delete("/device/force_logout/:id",authUser, ForceLogout);
tokenRouter.get("/device/findUser", TokenAuthUser,GetUserById);
tokenRouter.put("/device/selected-folders", authUser,updateSelectedFolders);
tokenRouter.get("/device/tokenSelectedFolder", TokenAuthUser, GetUpdateTokenFolder);
tokenRouter.post("/device/tokenLogAudit", authUser, recordAuditLog);
tokenRouter.get("/device/getTokenLogAudit", authUser, getAuditLogs);

export default tokenRouter