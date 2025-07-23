import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Internal mutation to create representative user
export const createRepresentativeUser = internalMutation({
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
      role: "representative", // Set role as representative
      isEmailVerified: true, // Representatives are pre-verified
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: "Representative user created successfully",
      userId,
    };
  },
});

// Internal mutation to create representative profile
export const createRepresentativeProfile = internalMutation({
  args: {
    userId: v.id("users"),
    department: v.string(),
    title: v.string(),
    specializations: v.array(v.string()),
    maxAppointmentsPerDay: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    representativeId: v.optional(v.id("representatives")),
  }),
  handler: async (ctx, args) => {
    // Check if representative profile already exists
    const existingProfile = await ctx.db
      .query("representatives")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingProfile) {
      return {
        success: false,
        message: "Representative profile already exists for this user",
      };
    }

    // Create representative profile
    const representativeId = await ctx.db.insert("representatives", {
      userId: args.userId,
      department: args.department,
      title: args.title,
      specializations: args.specializations,
      maxAppointmentsPerDay: args.maxAppointmentsPerDay,
    });

    return {
      success: true,
      message: "Representative profile created successfully",
      representativeId,
    };
  },
});

// Get representative profile by user ID
export const getRepresentativeByUserId = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("representatives"),
      userId: v.id("users"),
      department: v.string(),
      title: v.string(),
      specializations: v.array(v.string()),
      maxAppointmentsPerDay: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const representative = await ctx.db
      .query("representatives")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return representative;
  },
});

// Update representative profile
export const updateRepresentativeProfile = internalMutation({
  args: {
    representativeId: v.id("representatives"),
    department: v.optional(v.string()),
    title: v.optional(v.string()),
    specializations: v.optional(v.array(v.string())),
    maxAppointmentsPerDay: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { representativeId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      return {
        success: false,
        message: "No updates provided",
      };
    }

    await ctx.db.patch(representativeId, cleanUpdates);

    return {
      success: true,
      message: "Representative profile updated successfully",
    };
  },
});