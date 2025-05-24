import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";
import { emailService } from "./service/emailService";
import env from "../env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  baseURL: env.BACKEND_URL,
  secret: env.BETTER_AUTH_SECRET,

  trustedOrigins: [
    "tauri://localhost",
    "http://localhost:5173",
    "http://localhost:1420",
    "https://murmur.app.sandilya.dev",
  ],

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await emailService.sendVerificationOTP({
          email,
          otp,
          type: type as "sign-in" | "email-verification" | "forget-password",
        });
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 3,
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },

  cookies: {
    sessionToken: {
      name: "better-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        domain: undefined, // Let browser handle domain
      },
    },
  },

  user: {
    additionalFields: {
      // Add any custom user fields here if needed
    },
  },

  callbacks: {
    user: {
      created: async ({ user }: { user: any }) => {
        console.log("New user created:", user.id);

        // Initialize user settings when account is created
        try {
          await db.insert(schema.userSettings).values({
            userId: user.id,
            settings: {
              backend_url: env.BACKEND_URL + "/api",
              use_local_mode: false,
            },
          });
          console.log("User settings initialized for:", user.id);
        } catch (error) {
          console.error("Failed to initialize user settings:", error);
        }

        // Send welcome email if email service is configured
        if (emailService.isConfigured() && user.email) {
          try {
            await emailService.sendWelcomeEmail(user.email, user.name);
            console.log("Welcome email sent to:", user.email);
          } catch (error) {
            console.error("Failed to send welcome email:", error);
          }
        }
      },
    },
  },
});

export type Auth = typeof auth;
