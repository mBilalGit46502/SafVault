import express from "express"
import { changePassword, forgetPassword, getTokenCode, loginUser, logoutUser, registerUser, resetPassword, saveTokenCode, uploadAvatar } from "../controllers/userController.js"
import { authUser } from "../middleware/authUser.js"
import upload from "../utils/cloudinary.js"

const router= express.Router()

router.post("/register",registerUser)
router.post("/login",loginUser)
router.put("/forget-password",forgetPassword)
router.put("/reset-password",resetPassword)
router.post("/change-password",authUser,changePassword)
router.post("/logout",authUser,logoutUser)
router.post("/code",authUser,saveTokenCode)
router.get("/getCode",authUser,getTokenCode)
router.put("/update-avatar",authUser,upload.single("avatar"),uploadAvatar)


export default router