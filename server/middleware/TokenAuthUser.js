import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
export const TokenAuthUser = async (req, res, next) => {
  const token =
    req.cookies.tokenLogin || req.headers.authorization?.split(" ")[1];
  
  if (!token)
    return res.status(401).json({
      message: "unauthorized User",
      error: true,
      success: false,
    });
  try {
    const decode = await jwt.verify(token, process.env.JWT_TOKEN_SECRETE);

    req.userId = decode;
    next();
  } catch (error) {
    return res.status(401).json({
      message: error?.message || "Token expired or invalid",
      error: true,
      success: false,
    });
  }
};
