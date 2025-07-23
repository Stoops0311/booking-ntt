import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Helper function to generate session token
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Internal mutation to create user
export const createUser = internalMutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    dateOfBirth: v.string(),
    nationality: v.string(),
    passportId: v.string(),
    iqamaId: v.optional(v.string()),
    passwordHash: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    userId: v.optional(v.id("users")),
  }),
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      return {
        success: false,
        message: "User with this email already exists",
      };
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      fullName: args.fullName,
      email: args.email,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      nationality: args.nationality,
      passportId: args.passportId,
      iqamaId: args.iqamaId,
      passwordHash: args.passwordHash,
      role: "user",
      isEmailVerified: false,
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: "User registered successfully",
      userId,
    };
  },
});

// Internal query to get user by email
export const getUserByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      fullName: v.string(),
      email: v.string(),
      passwordHash: v.string(),
      role: v.union(v.literal("user"), v.literal("representative")),
    })
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
    };
  },
});

// Internal create session mutation
export const createSession = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    token: v.string(),
  }),
  handler: async (ctx, args) => {
    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.db.insert("sessions", {
      userId: args.userId,
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    return { token };
  },
});

// Internal mutation to update password
export const updateUserPassword = internalMutation({
  args: {
    userId: v.id("users"),
    passwordHash: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      passwordHash: args.passwordHash,
    });
    return null;
  },
});

// Internal mutation to clean up expired sessions
export const cleanupExpiredSessions = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    const expiredSessions = await ctx.db
      .query("sessions")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    
    let deletedCount = 0;
    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
      deletedCount++;
    }
    
    return deletedCount;
  },
});