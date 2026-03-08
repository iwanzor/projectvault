import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Permission } from "@/types/next-auth";

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] authorize called with:", credentials?.username);
        const username = credentials?.username;
        const password = credentials?.password;

        if (
          typeof username !== "string" ||
          typeof password !== "string" ||
          !username ||
          !password
        ) {
          console.log("[AUTH] Missing username or password");
          throw new Error("Username and password are required.");
        }

        console.log("[AUTH] Looking up user:", username);
        const user = await prisma.user.findUnique({
          where: { username },
          include: { privileges: true },
        });
        console.log("[AUTH] User found:", user ? user.id : "NOT FOUND");

        if (!user) {
          throw new Error("Invalid username or password.");
        }

        if (!user.isActive) {
          throw new Error("This account has been deactivated.");
        }

        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const minutes = Math.ceil(
            (user.lockedUntil.getTime() - Date.now()) / 1000 / 60
          );
          throw new Error(
            `Account is locked. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
          );
        }

        // If lock has expired, reset it
        if (user.lockedUntil && user.lockedUntil <= new Date()) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null },
          });
        }

        console.log("[AUTH] Checking password...");
        const passwordMatch = await bcrypt.compare(
          password,
          user.passwordHash
        );
        console.log("[AUTH] Password match:", passwordMatch);

        if (!passwordMatch) {
          const newFailedAttempts = (user.failedAttempts ?? 0) + 1;
          const updateData: { failedAttempts: number; lockedUntil?: Date } = {
            failedAttempts: newFailedAttempts,
          };

          if (newFailedAttempts >= LOCKOUT_THRESHOLD) {
            updateData.lockedUntil = new Date(
              Date.now() + LOCKOUT_DURATION_MS
            );
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          if (newFailedAttempts >= LOCKOUT_THRESHOLD) {
            throw new Error(
              "Too many failed attempts. Account locked for 15 minutes."
            );
          }

          throw new Error("Invalid username or password.");
        }

        // Reset failed attempts on successful login
        if (user.failedAttempts && user.failedAttempts > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null },
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const permissions: Permission[] = user.privileges.map((p: any) => ({
          module: p.module,
          viewAll: p.viewAll,
          viewDetails: p.viewDetails,
          canAdd: p.canAdd,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        }));

        const result = {
          id: String(user.id),
          userCode: user.userCode,
          username: user.username,
          branchCode: user.branchCode,
          isAdmin: user.isAdmin,
          permissions,
        };
        console.log("[AUTH] Returning user:", result.username, result.id);
        return result;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("[AUTH] jwt callback, user:", user?.username);
      if (user) {
        token.id = user.id!;
        token.userCode = user.userCode;
        token.username = user.username;
        token.branchCode = user.branchCode;
        token.isAdmin = user.isAdmin;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[AUTH] session callback, token.username:", token.username);
      session.user.id = token.id;
      session.user.userCode = token.userCode;
      session.user.username = token.username;
      session.user.branchCode = token.branchCode;
      session.user.isAdmin = token.isAdmin;
      session.user.permissions = token.permissions;
      return session;
    },
  },
});
