import express from "express";
import DBCONNECT from "./utils/db.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

DBCONNECT().catch((err) => {
  console.error("Database connection failed during cold start:", err);
});

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

app.set("trust proxy", true);

app.get("/", (req, res) => {
  res.send("Welcome to the Vercel Serverless API!");
});

app.use("/api/auth", userRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/user-auth", tokenRouter);

export default app;
