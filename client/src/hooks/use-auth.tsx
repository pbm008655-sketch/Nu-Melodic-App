import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/mobile-user"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["X-Auth-Token"] = token;
      }

      const res = await fetch("/api/mobile-user", {
        headers,
        credentials: "include",
      });

      if (res.status === 401) {
        return null;
      }

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return data.success ? data.user : null;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Mobile login attempt starting...", credentials);
      
      const res = await fetch("/api/mobile-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      const data = await res.json();
      console.log("Mobile login response received:", data);
      
      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }
      
      // Store token in multiple places for mobile compatibility
      if (data.token) {
        console.log("Storing token in localStorage and sessionStorage:", data.token);
        localStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('auth_token', data.token);
        
        console.log("Token stored. Checking localStorage:", localStorage.getItem('auth_token'));
        console.log("Token stored. Checking sessionStorage:", sessionStorage.getItem('auth_token'));
      } else {
        console.log("No token in response data");
      }
      
      return data.user;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/mobile-user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/mobile-user"] });
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      const data = await res.json();
      
      // Store token if provided
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      return data.user || data;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration Successful",
        description: `Welcome to MeloStream, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/mobile-logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      // Clear stored tokens
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/mobile-user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/mobile-user"] });
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
