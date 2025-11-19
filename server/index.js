import express from "express";
import DBCONNECT from "./utils/db.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import uploadRouter from "./routes/uploadRoutes.js";
import userRouter from "./routes/userRoutes.js";
import tokenRouter from "./routes/TokenUserRoutes.js";
dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.FRONTED_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.set("trust proxy", true);

const PORT = 4000;

app.get("/", (req, res) => {
  res.send("App is running");
});

DBCONNECT()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}
        `);
    });
  })
  .catch((err) => {});

app.use("/api/auth", userRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/user-auth", tokenRouter);
