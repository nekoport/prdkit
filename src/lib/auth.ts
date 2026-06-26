import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { comparePasswords, hashPassword, validatePasswordStrength } from "@/lib/password";
import {
  createVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
  isEmailEnabled,
} from "@/lib/email";
import { isAdminEmail } from "@/lib/admin";
import {
  getLockoutRemaining,
  recordFailedAttempt,
  resetFailedAttempts,
  auditLog,
} from "@/lib/security";
import { checkSignupLimit } from "@/lib/rate-limit";

const hasGoogle =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

function getClientIP(req: any): string {
  const xff = req?.headers?.get?.("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "unknown";
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Nama (sign up)", type: "text", optional: true },
        mode: { label: "Mode", type: "text" },
      },
      async authorize(creds, req) {
        if (!creds?.email || !creds?.password) return null;
        const email = creds.email.toLowerCase().trim();
        const mode = creds.mode || "signin";
        const ip = getClientIP(req);

        // A07: Account lockout check (sign-in only)
        if (mode === "signin") {
          const lockoutRemaining = getLockoutRemaining(email);
          if (lockoutRemaining > 0) {
            const minutes = Math.ceil(lockoutRemaining / 60000);
            auditLog("LOGIN_LOCKED", { email, ip, details: { minutesRemaining: minutes } });
            throw new Error(
              `Akun dikunci karena terlalu banyak percobaan gagal. Coba lagi dalam ${minutes} menit.`
            );
          }
        }

        if (mode === "signup") {
          // A06: Rate limit signup per IP
          const rl = await checkSignupLimit(ip);
          if (!rl.ok) {
            auditLog("SIGNUP_BLOCKED_RATE", { email, ip });
            throw new Error("Terlalu banyak signup dari IP ini. Coba lagi nanti.");
          }

          // A07: Password strength validation
          const pwdCheck = validatePasswordStrength(creds.password);
          if (!pwdCheck.ok) {
            throw new Error(pwdCheck.errors[0]);
          }

          const existing = await db.user.findUnique({ where: { email } });
          if (existing) {
            throw new Error("Email sudah terdaftar. Silakan sign in.");
          }
          const name = (creds.name || email.split("@")[0]).trim();
          const passwordHash = await hashPassword(creds.password);

          // Jika email service tidak aktif (dev mode), auto-verify
          const emailVerified = isEmailEnabled() ? null : new Date();

          const user = await db.user.create({
            data: {
              email,
              name,
              passwordHash,
              provider: "credentials",
              emailVerified,
            },
          });

          auditLog("SIGNUP", { userId: user.id, email, ip });

          // Kirim email verifikasi jika service aktif
          if (isEmailEnabled()) {
            const token = await createVerificationToken(user.id);
            await sendVerificationEmail(user.email, user.name, token);
            auditLog("EMAIL_VERIFICATION_SENT", { userId: user.id, email, ip });
            throw new Error(
              "SIGNUP_SUCCESS_NEED_VERIFY: Akun dibuat. Cek email kamu untuk verifikasi."
            );
          }

          // Dev mode (auto-verified): kirim welcome email
          // Production: welcome email dikirim setelah verify-email page
          if (!isEmailEnabled()) {
            await sendWelcomeEmail(user.email, user.name);
          }

          return { id: user.id, email: user.email, name: user.name } as any;
        }

        // Sign-in mode
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
          recordFailedAttempt(email);
          auditLog("LOGIN_FAILED", { email, ip, details: { reason: "user_not_found" } });
          throw new Error("Email atau password salah.");
        }
        const ok = await comparePasswords(creds.password, user.passwordHash);
        if (!ok) {
          recordFailedAttempt(email);
          auditLog("LOGIN_FAILED", {
            userId: user.id,
            email,
            ip,
            details: { reason: "wrong_password" },
          });
          throw new Error("Email atau password salah.");
        }

        // Reset failed attempts on success
        resetFailedAttempts(email);
        auditLog("LOGIN_SUCCESS", { userId: user.id, email, ip });

        // Jika email verification aktif tapi user belum verifikasi
        if (isEmailEnabled() && !user.emailVerified) {
          const token = await createVerificationToken(user.id);
          await sendVerificationEmail(user.email, user.name, token);
          throw new Error(
            "EMAIL_NOT_VERIFIED: Email kamu belum diverifikasi. Link verifikasi baru sudah dikirim."
          );
        }

        return { id: user.id, email: user.email, name: user.name } as any;
      },
    }),
    ...(hasGoogle
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Google OAuth: create user di DB jika belum ada, kirim welcome email
      if (account?.provider === "google" && user.email) {
        const existing = await db.user.findUnique({
          where: { email: user.email },
        });

        if (existing) {
          // User existing: auto-verify email kalau belum
          if (!existing.emailVerified) {
            await db.user.update({
              where: { id: existing.id },
              data: { emailVerified: new Date() },
            });
            auditLog("EMAIL_VERIFICATION_SUCCESS", {
              userId: existing.id,
              email: existing.email,
              details: { provider: "google" },
            });
          }
          auditLog("LOGIN_SUCCESS", {
            userId: existing.id,
            email: existing.email,
            details: { provider: "google" },
          });
        } else {
          // User baru via Google — create di DB
          // Auto-promote ke admin jika email ada di ADMIN_EMAILS
          const role = isAdminEmail(user.email) ? "admin" : "user";
          const newUser = await db.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split("@")[0],
              image: user.image || null,
              provider: "google",
              role,
              emailVerified: new Date(), // Google email sudah terverifikasi
            },
          });

          auditLog("SIGNUP", {
            userId: newUser.id,
            email: newUser.email,
            details: { provider: "google", autoVerified: true },
          });
          auditLog("EMAIL_VERIFICATION_SUCCESS", {
            userId: newUser.id,
            email: newUser.email,
            details: { provider: "google", autoVerified: true },
          });
          auditLog("LOGIN_SUCCESS", {
            userId: newUser.id,
            email: newUser.email,
            details: { provider: "google", newUser: true },
          });

          // Kirim welcome email (production mode)
          // Di dev mode, sendWelcomeEmail akan skip silently
          await sendWelcomeEmail(newUser.email, newUser.name);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
};

export const isGoogleEnabled = hasGoogle;
export const isEmailVerificationEnabled = isEmailEnabled();
