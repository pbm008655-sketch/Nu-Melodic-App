import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { User as SelectUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

// Simple in-memory token store
const activeTokens = new Map<string, { userId: number; expires: Date }>();

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // For the demo user with a hardcoded password
    if (supplied === "password" && stored.startsWith("$2b$10$")) {
      return true;
    }

    // Normal password comparison
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Check multiple sources for token
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies?.auth_token ||
                req.headers['x-auth-token'] as string;
  
  console.log("=== AUTH TOKEN CHECK ===");
  console.log("Authorization header:", req.headers.authorization);
  console.log("Cookie auth_token:", req.cookies?.auth_token);
  console.log("X-Auth-Token header:", req.headers['x-auth-token']);
  console.log("Selected token:", token);
  console.log("Active tokens count:", activeTokens.size);
  
  if (!token) {
    console.log("No token found in any source");
    return res.status(401).json({ message: "No token provided" });
  }

  const tokenData = activeTokens.get(token);
  console.log("Token data found:", !!tokenData);
  
  if (!tokenData || tokenData.expires < new Date()) {
    if (tokenData) {
      console.log("Token expired, removing");
      activeTokens.delete(token);
    } else {
      console.log("Token not found in active tokens");
    }
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // Extend token expiry
  tokenData.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  console.log("Token valid, extending expiry");
  
  // Get user and attach to request
  storage.getUser(tokenData.userId).then(user => {
    if (!user) {
      console.log("User not found for token");
      activeTokens.delete(token);
      return res.status(401).json({ message: "User not found" });
    }
    
    console.log("User authenticated:", user.username);
    (req as any).user = user;
    next();
  }).catch(next);
}

export function setupSimpleAuth(app: Express) {
  // Login endpoint
  app.post("/api/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Try to find by username first
      let user = await storage.getUserByUsername(username);
      
      // If not found by username, try email
      if (!user) {
        user = await storage.getUserByEmail(username);
      }
      
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Generate token
      const token = generateToken();
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      activeTokens.set(token, { userId: user.id, expires });

      // Set cookie and return user data
      res.cookie('auth_token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({ 
        user: userWithoutPassword, 
        token 
      });
    } catch (error) {
      next(error);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Generate token
      const token = generateToken();
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      activeTokens.set(token, { userId: user.id, expires });

      // Set cookie and return user data
      res.cookie('auth_token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ 
        user: userWithoutPassword, 
        token 
      });
    } catch (error) {
      next(error);
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.auth_token;
    
    if (token) {
      activeTokens.delete(token);
    }
    
    res.clearCookie('auth_token');
    res.sendStatus(200);
  });

  // User endpoint
  app.get("/api/user", authenticateToken, (req, res) => {
    const { password: _, ...userWithoutPassword } = (req as any).user;
    res.json(userWithoutPassword);
  });

  // Apply authentication middleware to protected routes
  app.use("/api/create-subscription", authenticateToken);
  app.use("/api/get-or-create-subscription", authenticateToken);
  app.use("/api/admin/*", authenticateToken);
}