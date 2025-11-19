import rateLimit from "express-rate-limit";
import express from "express";
const router = express.Router();

export const tokenLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: {
    message:
      "Too many token login attempts. Please wait 15 minutes before trying again.",
    error: true,
    success: false,
  },
  standardHeaders: true, 
  legacyHeaders: false,
});


