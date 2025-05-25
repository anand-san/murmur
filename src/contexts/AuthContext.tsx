import React, { createContext, useContext, useEffect, useState } from "react";
import { authClient, type Session } from "../api/auth";
import toast from "react-hot-toast";

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
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await authClient.getSession();
      if (error) {
        toast("Could not get existing session, please log in again.");
      } else {
        setSession(data);
      }
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
      setIsLoading(true);
      try {
        const currentSession = await authClient.getSession();
        await authClient.revokeSession({
          token: currentSession.data?.session.token ?? "",
        });
        await authClient.signOut();
        await checkSession();
      } catch (error) {
        console.error("Backend signout failed:", error);
      }
    } catch (error) {
      toast.error("Sign out failed:");
    } finally {
      setIsLoading(false);
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
