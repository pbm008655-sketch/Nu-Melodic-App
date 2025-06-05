import { createContext, ReactNode, useContext } from "react";
import { User as SelectUser, InsertUser } from "@shared/schema";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Bypass authentication - return default user
  const user: SelectUser = {
    id: 1,
    username: "demo",
    email: "demo@example.com",
    password: "",
    isPremium: true,
    premiumExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    stripeCustomerId: null,
    stripeSubscriptionId: null
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
        error: null,
        loginMutation: { mutate: () => {}, isPending: false },
        logoutMutation: { mutate: () => {}, isPending: false },
        registerMutation: { mutate: () => {}, isPending: false },
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