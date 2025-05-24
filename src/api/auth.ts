import { createAuthClient } from "better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL:
    (import.meta.env.VITE_BACKEND_ENDPOINT ?? "http://localhost:5555") +
    "/api/auth",

  fetchOptions: {
    credentials: "include",
  },

  plugins: [emailOTPClient()],
});

export type Session = typeof authClient.$Infer.Session;
