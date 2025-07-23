import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper function to generate session token
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Verify session token
export const verifySession = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.id("users"),
      user: v.object({
        id: v.id("users"),
        fullName: v.string(),
        email: v.string(),
        role: v.union(v.literal("user"), v.literal("representative")),
        isEmailVerified: v.boolean(),
      }),
    })
  ),
  handler: async (ctx, args) => {
    // Find session by token
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      // Session is expired - return null
      return null;
    }

    // Get user details
    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      userId: session.userId,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  },
});

// Logout user
export const logout = mutation({
  args: {
    token: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Find and delete session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return {
      success: true,
      message: "Logged out successfully",
    };
  },
});

// For now, export placeholders for register and login from here
// These will be replaced with proper actions later
export { register, login, updatePassword } from "./authActions";