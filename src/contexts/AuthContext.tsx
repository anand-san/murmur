import React, { createContext, useContext, useEffect, useState } from "react";
import { authClient, type Session } from "../api/auth";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  sendOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (
    email: string,
    otp: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app start
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data } = await authClient.getSession();
      setSession(data);
    } catch (error) {
      console.error("Session check failed:", error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (email: string) => {
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Send OTP failed:", error);
      return { success: false, error: "Failed to send verification code" };
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const { data, error } = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        await checkSession();
        return { success: true };
      }

      return { success: false, error: "Authentication failed" };
    } catch (error) {
      console.error("Verify OTP failed:", error);
      return { success: false, error: "Failed to verify code" };
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
      setSession(null);

      // Force clear any remaining session state
      await checkSession();
    } catch (error) {
      console.error("Sign out failed:", error);
      // Even if sign out fails, clear local session state
      setSession(null);
      await checkSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, isLoading, sendOTP, verifyOTP, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
