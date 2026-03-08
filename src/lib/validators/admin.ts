import { z } from "zod/v4";
import { listParamsSchema } from "./setup";

// ─── Users ──────────────────────────────────────────

export const listUsersSchema = listParamsSchema.extend({
  sortBy: z.string().default("username"),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  isAdmin: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  branchCode: z.string().optional(),
});

export type ListUsersParams = z.infer<typeof listUsersSchema>;

export const createUserSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  userCode: z.string().min(1, "User code is required").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
  branchCode: z.string().min(1, "Branch code is required").max(50),
  isAdmin: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  username: z.string().min(1).max(100).optional(),
  userCode: z.string().min(1).max(50).optional(),
  branchCode: z.string().min(1).max(50).optional(),
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const setPermissionsSchema = z.object({
  permissions: z.array(
    z.object({
      module: z.string().min(1),
      viewAll: z.boolean(),
      viewDetails: z.boolean(),
      canAdd: z.boolean(),
      canEdit: z.boolean(),
      canDelete: z.boolean(),
    })
  ),
});
