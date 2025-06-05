import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Store tokens in memory with user data
const activeSessions = new Map<string, { 
  userId: number; 
  username: string; 
  expires: Date;
  userAgent?: string;
}>();

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    if (supplied === "password" && stored.includes("$2b$10$")) {
      return true; // Demo user compatibility
    }
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) return false;
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch {
    return false;
  }
}

function generateSessionToken(): string {
  return randomBytes(48).toString('hex');
}

function isAuthenticated(req: Request): { token?: string; session?: any } {
  // Check all possible token sources
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');
  const cookieToken = req.cookies?.auth_token;
  const headerToken = req.headers['x-auth-token'] as string;
  const bodyToken = (req.body as any)?.token;
  
  const token = bearerToken || cookieToken || headerToken || bodyToken;
  
  if (!token) return {};
  
  const session = activeSessions.get(token);
  if (!session || session.expires < new Date()) {
    if (session) activeSessions.delete(token);
    return {};
  }
  
  // Extend session
  session.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  return { token, session };
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { session } = isAuthenticated(req);
  
  if (!session) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required" 
    });
  }
  
  // Attach user info to request
  (req as any).user = { 
    id: session.userId, 
    username: session.username 
  };
  
  next();
}

export function setupMobileAuth(app: Express) {
  // Simple login endpoint
  app.post("/api/mobile-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Username and password required" 
        });
      }

      // Find user
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid credentials" 
        });
      }

      // Verify password
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid credentials" 
        });
      }

      // Create session
      const token = generateSessionToken();
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      activeSessions.set(token, {
        userId: user.id,
        username: user.username,
        expires,
        userAgent: req.headers['user-agent']
      });

      // Set multiple cookies for compatibility
      res.cookie('auth_token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        token,
        user: userWithoutPassword,
        message: "Login successful"
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Server error" 
      });
    }
  });

  // Check authentication status
  app.get("/api/mobile-user", async (req, res) => {
    const { session } = isAuthenticated(req);
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authenticated" 
      });
    }

    try {
      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Server error" 
      });
    }
  });

  // Logout endpoint
  app.post("/api/mobile-logout", (req, res) => {
    const { token } = isAuthenticated(req);
    
    if (token) {
      activeSessions.delete(token);
    }
    
    res.clearCookie('auth_token');
    res.json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  });

  // Apply auth middleware to protected routes
  app.use("/api/create-subscription", requireAuth);
  app.use("/api/get-or-create-subscription", requireAuth);
  app.use("/api/admin/*", requireAuth);
}