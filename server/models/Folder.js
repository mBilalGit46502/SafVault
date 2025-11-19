import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "file",
      },
    ],
  },
  {
    timestamps: true,
  }
);
folderSchema.index({ name: 1, createdBy: 1 }, { unique: true });
const folder = mongoose.model("folder", folderSchema);
export default folder;
