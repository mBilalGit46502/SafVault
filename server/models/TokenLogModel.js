import mongoose from "mongoose";

const TokenLogSchema = new mongoose.Schema({
  linkedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // which user the token belongs to
  },
  LoginUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  deviceName: {
    type: String, // optional: to help owner identify device (e.g. "Bilal’s iPhone")
  },
  isApproved: {
    type: Boolean,
    default: false, // false = needs approval, true = already allowed
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: {
    type: Date,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // who approved (the main account owner)
  },
  selectedFolders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "folder",
      default: [],
    },
  ],
});

const TokenLog = mongoose.model("TokenLog", TokenLogSchema);
export default TokenLog;
