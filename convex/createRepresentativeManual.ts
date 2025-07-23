import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Manual representative creation mutation (for testing)
export const createRepresentativeManual = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    dateOfBirth: v.string(),
    nationality: v.string(),
    passportId: v.string(),
    iqamaId: v.optional(v.string()),
    passwordHash: v.string(),
    department: v.string(),
    title: v.string(),
    specializations: v.array(v.string()),
    maxAppointmentsPerDay: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    userId: v.optional(v.id("users")),
    representativeId: v.optional(v.id("representatives")),
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

    // Create user with representative role
    const userId = await ctx.db.insert("users", {
      fullName: args.fullName,
      email: args.email,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      nationality: args.nationality,
      passportId: args.passportId,
      iqamaId: args.iqamaId,
      passwordHash: args.passwordHash,
      role: "representative",
      isEmailVerified: true,
      createdAt: Date.now(),
    });

    // Create representative profile
    const representativeId = await ctx.db.insert("representatives", {
      userId: userId,
      department: args.department,
      title: args.title,
      specializations: args.specializations,
      maxAppointmentsPerDay: args.maxAppointmentsPerDay,
    });

    return {
      success: true,
      message: "Representative created successfully",
      userId,
      representativeId,
    };
  },
});