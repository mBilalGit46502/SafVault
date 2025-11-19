import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const DBCONNECT = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    return connection;
  } catch (error) {
    console.log(" Mongoose DB connection failed:", error.message);
    process.exit(1);
  }
};

export default DBCONNECT;
