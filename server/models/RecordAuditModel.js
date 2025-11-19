import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  // The user who performed the action
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  actionType: {
    type: String,
    required: true,
    enum: [
      "TOKEN_REGENERATED",
      "FOLDER_CREATED",
      "LOGIN_SUCCESS",
      "LOGIN_FAILED",
      "SECURITY_UPDATE",
    ],
  },
  
  description: {
    type: String,
    required: true,
  },
 
  metadata: {
    type: mongoose.Schema.Types.Mixed, 
  },
 
  ipAddress: {
    type: String,
    default: "N/A",
  },
 
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
