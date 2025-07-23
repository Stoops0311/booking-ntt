"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import bcrypt from "bcryptjs";
import { Id } from "./_generated/dataModel";

// Register a new user
export const register = action({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    dateOfBirth: v.string(),
    nationality: v.string(),
    passportId: v.string(),
    iqamaId: v.optional(v.string()),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    userId: v.optional(v.id("users")),
  }),
  handler: async (ctx, args) => {
    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(args.password, 10);

    const result: {
      success: boolean;
      message: string;
      userId?: Id<"users">;
    } = await ctx.runMutation(internal.authHelpers.createUser, {
      fullName: args.fullName,
      email: args.email,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      nationality: args.nationality,
      passportId: args.passportId,
      iqamaId: args.iqamaId,
      passwordHash,
    });

    return result;
  },
});

// Login user
export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    token: v.optional(v.string()),
    user: v.optional(
      v.object({
        id: v.id("users"),
        fullName: v.string(),
        email: v.string(),
        role: v.union(v.literal("user"), v.literal("representative")),
      })
    ),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    token?: string;
    user?: {
      id: Id<"users">;
      fullName: string;
      email: string;
      role: "user" | "representative";
    };
  }> => {
    // Get user by email
    const user: {
      _id: Id<"users">;
      fullName: string;
      email: string;
      passwordHash: string;
      role: "user" | "representative";
    } | null = await ctx.runQuery(internal.authHelpers.getUserByEmail, {
      email: args.email,
    });

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(args.password, user.passwordHash);
    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Create session
    const sessionResult: { token: string } = await ctx.runMutation(internal.authHelpers.createSession, {
      userId: user._id,
    });

    return {
      success: true,
      message: "Login successful",
      token: sessionResult.token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  },
});

// Update user password
export const updatePassword = action({
  args: {
    token: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify session
    const sessionData = await ctx.runQuery(api.auth.verifySession, {
      token: args.token,
    });

    if (!sessionData) {
      return {
        success: false,
        message: "Invalid or expired session",
      };
    }

    // Get user with password hash
    const user = await ctx.runQuery(internal.authHelpers.getUserByEmail, {
      email: sessionData.user.email,
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(args.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return {
        success: false,
        message: "Current password is incorrect",
      };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(args.newPassword, 10);

    // Update password
    await ctx.runMutation(internal.authHelpers.updateUserPassword, {
      userId: user._id,
      passwordHash: newPasswordHash,
    });

    return {
      success: true,
      message: "Password updated successfully",
    };
  },
});