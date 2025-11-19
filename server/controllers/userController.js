import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { accessToken } from "../utils/generateToken.js";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import { decryptData, encryptData } from "../utils/encryption.js";
import { generatePasswordResetEmail } from "../utils/genrateForgetEmailSend.js";
import { sendEmail } from "../utils/EmailSender.js";
import { generateWelcomeEmail } from "../utils/GenerateWelcomeEmail.js";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRETE,
});

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  let emailStatusMessage = "User created successfully!"; // Default success message

  // --- 1. Validation Checks ---
  if (!(username && email && password)) {
    return res.status(400).json({
      message: "Please fill all fields.",
      error: true,
      success: false,
    });
  }

  // --- 2. Check for Existing User ---
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      message: "A user with this email already exists.",
      error: true,
      success: false,
    });
  }

  try {
    // --- 3. Hash Password & Create User (CRITICAL STEP) ---
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashPassword,
    });

    const userData = await User.findById(user._id).select("-password");

    // --- 4. Attempt to Send Welcome Email (NON-CRITICAL STEP) ---
    try {
      const startLink = process.env.FRONTEND_URL || "https://defaultappurl.com";
      const subject = `Welcome to SafVault, ${username}! Your Secure Vault Awaits.`;
      const htmlBody = generateWelcomeEmail(username, startLink);

      await sendEmail(
        email,
        subject,
        htmlBody
        // Assuming your sendEmail utility correctly handles the replyTo being undefined if not passed.
      );

      // Set success message if email succeeded
      emailStatusMessage =
        "User created successfully! Please check your email to get started.";
    } catch (emailError) {
    
      emailStatusMessage =
        "User created successfully, but there was an issue sending the welcome email.";
    }

    // --- 5. Final Success Response ---
    // Return 201 success code based on the successful DB entry.
    return res.status(201).json({
      // Use the status message derived from the email result
      message: emailStatusMessage,
      success: true,
      error: false,
      data: userData,
    });
  } catch (error) {
   let errorMessage = "Registration failed.";

        if (error.name === 'ValidationError') {
            // Extract the specific message from the 'password' field validation error
            if (error.errors.password) {
                errorMessage = error.errors.password.message; // This will use the 'Password must be at least 8 characters long.' message
            }
        } else if (error.code === 11000) {
            // Handle duplicate key error (e.g., email already exists)
            errorMessage = "Email address is already in use.";
        }

        res.status(400).json({ success: false, error: true, message: errorMessage });
    
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!(email, password))
    return res.status(501).json({
      message: "plz fill all the field",
      error: true,
      success: false,
    });

  const user = await User.findOne({ email });
  console.log(user);

  if (!user)
    return res.status(401).json({
      message: "invalid credentials",
      error: true,
      success: false,
    });

  const dbPassword = await bcrypt.compare(password, user.password);
  console.log(dbPassword);

  if (!dbPassword)
    return res.status(405).json({
      message: "Password is incorrect",
      error: true,
      success: false,
    });
  const token = await accessToken(user._id);
  // console.log(token);

  const cookiesOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000,
  };
  res.cookie("accessToken", token, cookiesOption);
  const userData = await User.findById(user._id).select("-password");
  // console.log("aaaaaaaaaa",userData);

  return res.status(200).json({
    message: "User login successfully",
    error: false,
    success: true,
    data: userData,
    token,
  });
};

export const logoutUser = async (req, res) => {
  const { userId } = req.userId;
  // console.log("abc", userId);

  const user = await User.findById({ _id: userId });
  if (!user)
    return res.status(402).json({
      message: "failed to Logout",
      error: true,
      success: false,
    });
  const cookiesOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000,
  };

  res.clearCookie("accessToken", cookiesOption);

  return res.status(200).json({
    message: "User Logout Successfully",
    error: false,
    success: true,
  });
};

export const uploadAvatar = async (req, res) => {
  try {
    const { userId } = req.userId;
    const file = req.file;

    // 1️⃣ Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        message: "Please login first",
        error: true,
        success: false,
      });
    }

    if (user.avatar && user.avatar.filename) {
      try {
        const deleteResult = await cloudinary.uploader.destroy(
          user.avatar.filename
        );
        // console.log(" Old avatar deleted:", deleteResult);
      } catch (err) {
        // console.warn(" Failed to delete old avatar:", err.message);
        return res.status(400).json({
          message: "Failed to delete old avatar" || err.message,
          error: true,
          success: true,
        });
      }
    }

    // 3️⃣ Update user with new avatar
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatar: {
          url: file.path,
          filename: file.filename, // use for future deletion
        },
      },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      message: "Profile picture updated successfully",
      error: false,
      success: true,
      data: updatedUser,
    });
  } catch (error) {
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

export const saveTokenCode = async (req, res) => {
  const { userId } = req.userId;
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({
      message: "token is required",
      error: true,
      success: false,
    });
  }

  const hashToken = encryptData(token, process.env.JWT_TOKEN_SECRETE);
  // const hashToken = await jwt.sign({userId, token }, process.env.JWT_TOKEN_SECRETE);
  console.log(hashToken);

  const updateUser = await User.findByIdAndUpdate(
    { _id: userId },
    { token_code: hashToken },
    { new: true }
  );

  if (!updateUser)
    return res.status(401).json({
      message: "user not found",
      error: true,
      success: false,
    });

  return res.status(201).json({
    message: "code saved",
    error: false,
    success: true,
  });
};

export const getTokenCode = async (req, res) => {
  try {
    const { userId } = req.userId;

    const user = await User.findOne({ _id: userId });

    if (!user)
      res.status(401).json({
        message: "user Not found",
        error: true,
        success: false,
      });

    const saveToken = user.token_code;
    if (!saveToken) {
      return res.status(402).json({
        message: "token not exist",
        error: false,
        success: true,
      });
    }
    // const token = jwt.verify(saveToken, process.env.JWT_TOKEN_SECRETE);
    const token = decryptData(saveToken, process.env.JWT_TOKEN_SECRETE);
    console.log("decode", token);

    return res.status(201).json({
      message: "token retrieve successfully",
      error: false,
      success: true,
      data: token,
    });
  } catch (error) {
    return res.status(503).json({
      message: error?.message,
      error: true,
      success: false,
    });
  }
};

const TOKEN_EXPIRY_DURATION = 300000;
export const forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email address is required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "the email address not exist",
        false: true,
        success: false,
      });
    }

    // Generic success response for security (prevents user enumeration)
    const genericSuccessResponse = {
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };

    if (!user) {
      // Return success even if user not found (security best practice)
      return res.status(200).json(genericSuccessResponse);
    }

    // 1. Generate Secure Token and Expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + TOKEN_EXPIRY_DURATION;

    // 2. Save token/expiry to DB
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // 3. Construct Reset Link
    const frontendURL = process.env.FRONTED_URL;
    // The link MUST contain the token and email
    const resetLink = `${frontendURL}/verify-reset-code?token=${resetToken}&email=${email}`;

    const username = user.username || "User";
    const subject = "SafVault Password Reset Request";
    const htmlBody = generatePasswordResetEmail(username, resetLink);

    // 4. Send Email (CRITICAL DEBUGGING BLOCK ADDED)
    try {
      await sendEmail(email, subject, htmlBody);
      console.log(`Password reset email successfully initiated for: ${email}`);
    } catch (emailError) {
      // Log the email failure to your server console for debugging
      console.error(
        `ERROR: Failed to send password reset email to ${email}.`,
        emailError
      );
    }

    // 5. Final Response
    return res.status(200).json(genericSuccessResponse);
  } catch (error) {
    console.error("Server error during forgetPassword process:", error);
    return res.status(500).json({
      success: false,
      message: "A server error occurred. Please try again.",
    });
  }
};

export const resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body; // Basic Validation

  if (!email || !token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Missing email, token, or new password in the request.",
    });
  }

  try {
    // 1. Find User by Email AND Token
    const user = await User.findOne({
      email,
      resetPasswordToken: token,
    }); // 2. Token Validity Check (Wrong/Already Used Token)

    if (!user) {
      return res.status(401).json({
        success: false,
        error:true,
        message:
          "Invalid token. The link is either incorrect or has already been used.",
        errorType: "INVALID_TOKEN", // For frontend to show specific message/link
      });
    } // 3. Token Expiration Check (Time-based failure)

    if (user.resetPasswordExpires < Date.now().toLocaleString()) {
  
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(401).json({
        success: false,
        error:true,
        message:
          "This password reset link has expired. Your password was NOT changed.",
        errorType: "EXPIRED_TOKEN", // CRITICAL: For frontend detection
      });
    } // 4. Hash New Password and Update (Token is valid and not expired)

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashPassword; // 5. CLEAR THE TOKENS (Prevents future reuse of a valid token)

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save(); // 6. Success Response

    return res.status(200).json({
      success: true,
      error:false,
      message:
        "Password successfully reset! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Server error during password reset:", error);
    return res.status(500).json({
      success: false,
      error:false,
      message: "A server error occurred during password reset.",
    });
  }
};

const MAX_PASSWORD_LENGTH = 30;
const MIN_PASSWORD_LENGTH = 8;
const SECRET_KEY = process.env.JWT_SECRET; // Your JWT Secret Key


export const changePassword = async (req, res) => {
  try {
    
    const {userId} = req.userId;

  
    const { currentPassword, newPassword } = req.body;


    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Both current password and new password are required.",
        success: false,
      });
    }

    if (
      newPassword.length < MIN_PASSWORD_LENGTH ||
      newPassword.length > MAX_PASSWORD_LENGTH
    ) {
      return res.status(400).json({
        message: `New password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
        success: false,
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from the current password.",
        success: false,
      });
    }

    // 4. Find the user
    const user = await User.findById(userId);
    if (!user) {
   
      return res.status(404).json({
        message: "User not found.",
        success: false,
      });
    }

    
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect current password.",
        success: false,
      });
    }

    // 6. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // 7. Update the password in the database
    user.password = hashedNewPassword;
    await user.save();

    
    res.status(200).json({
      message: "Password changed successfully. Please log in again.",
      success: true,
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({
      message: "An error occurred while changing the password.",
      error: error.message,
      success: false,
    });
  }
};

