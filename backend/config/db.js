import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

const connectDB = async () => {
  try {
    const dbType = process.env.DB || "LOCAL";

    const mongoURI =
      dbType === "CLOUD"
        ? process.env.MONGODB_CLOUD_URI
        : process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MongoDB URI is missing");
    }

    await mongoose.connect(mongoURI);

    console.log("MongoDB connected successfully");
    console.log("DB Type:", dbType);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    throw err; // Re-throw to prevent server from starting without DB
  }
};

export default connectDB

