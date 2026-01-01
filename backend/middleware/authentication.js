import { verifyToken } from "@clerk/backend";


// Check if CLERK_SECRET_KEY is set
if (!process.env.CLERK_SECRET_KEY) {
  console.warn("⚠️  CLERK_SECRET_KEY is not set in environment variables");
  console.warn("⚠️  Token verification will fail. Please set CLERK_SECRET_KEY in your .env file");
}

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.log("No authorization header");
      return res.status(401).json({ message: "Unauthorized: No authorization header" });
    }
    
    const token = authHeader.split(" ")[1];
    
    if (!token) {
      console.log("No token in authorization header");
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    
    console.log("Token received, length:", token.length);
    console.log("Token preview:", token.substring(0, 20) + "...");
    
    if (!process.env.CLERK_SECRET_KEY) {
      console.error("CLERK_SECRET_KEY is not set in environment variables");
      return res.status(500).json({ message: "Server configuration error: Clerk secret key not configured" });
    }
    
    // Verify the token using @clerk/backend
    // The secretKey option is required
    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    
    req.userId = decoded.sub;
    console.log("Token verified successfully, userId:", req.userId);
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    console.error("Error details:", err);
    return res.status(401).json({ message: "Unauthorized: " + err.message });
  }
}

export default authMiddleware
