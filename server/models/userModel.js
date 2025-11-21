import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters long."],
      required: true,
    },
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: String,
      default: undefined,
    },
    token_code: {
      type: String,
      default: "",
    },
    allowTokenDownload: {
      type: Boolean,
      default: false, 
    },
    avatar: {
      url: String,
      filename: String,
    },
    selectedFolders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "folder",
        default: [],
      },
    ],
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
