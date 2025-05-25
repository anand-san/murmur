import { Navigate } from "react-router-dom";
import { LoginButton } from "../../components/auth/LoginButton";
import { useAuth } from "@/contexts/AuthContext";
import MurmurLoader from "@/components/ui/MurmurLoader";

export function LoginPage() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <MurmurLoader />;
  }

  if (session?.session.id) {
    console.log("User already logged in, redirecting to home page");
    return <Navigate to="/chat/new" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4">
              <img src="/logo.png" alt="Murmur Logo" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Welcome to Murmur
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Log in to access your conversations and settings
            </p>
          </div>

          {/* Login Form */}
          <LoginButton />
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
