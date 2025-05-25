import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, emailOTP } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";
import { emailService } from "./service/emailService";
import env from "../env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
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
      expiresIn: 300,
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

  advanced: {
    cookiePrefix: "murmur-app",
    crossSubDomainCookies: {
      enabled: true,
    },
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      domain: undefined,
      partitioned: false,
    },
    cookies: {
      session_token: {
        name: "better-auth.session-token",
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }
      console.log("Before hook for sign-up/email");
    }),
  },

  databaseHooks: {
    account: {
      create: {
        async after(account) {
          console.log("New account created:", account.id);
          // if (emailService.isConfigured() && ) {
          //   try {
          //     await emailService.sendWelcomeEmail(user.email, user.name);
          //     console.log("Welcome email sent to:", user.email);
          //   } catch (error) {
          //     console.error("Failed to send welcome email:", error);
          //   }
          // }
        },
      },
    },
    session: {
      create: {
        async after(session) {
          console.log("New session created:", session.id);
        },
      },
    },
  },
});

export type Auth = typeof auth;
