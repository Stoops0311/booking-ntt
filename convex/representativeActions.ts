"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import bcrypt from "bcryptjs";
import { Id } from "./_generated/dataModel";

// Create embassy representative account (admin only)
export const createRepresentative = action({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    dateOfBirth: v.string(),
    nationality: v.string(),
    passportId: v.string(),
    iqamaId: v.optional(v.string()),
    password: v.string(),
    // Representative-specific fields
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
    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(args.password, 10);

    // Create user with representative role
    const userResult: {
      success: boolean;
      message: string;
      userId?: Id<"users">;
    } = await ctx.runMutation(internal.representativeHelpers.createRepresentativeUser, {
      fullName: args.fullName,
      email: args.email,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      nationality: args.nationality,
      passportId: args.passportId,
      iqamaId: args.iqamaId,
      passwordHash,
    });

    if (!userResult.success || !userResult.userId) {
      return {
        success: false,
        message: userResult.message,
      };
    }

    // Create representative profile
    const repResult: {
      success: boolean;
      message: string;
      representativeId?: Id<"representatives">;
    } = await ctx.runMutation(internal.representativeHelpers.createRepresentativeProfile, {
      userId: userResult.userId,
      department: args.department,
      title: args.title,
      specializations: args.specializations,
      maxAppointmentsPerDay: args.maxAppointmentsPerDay,
    });

    if (!repResult.success) {
      // If representative profile creation fails, we should ideally rollback the user creation
      // For now, we'll just return the error
      return {
        success: false,
        message: repResult.message,
        userId: userResult.userId,
      };
    }

    return {
      success: true,
      message: "Representative account created successfully",
      userId: userResult.userId,
      representativeId: repResult.representativeId,
    };
  },
});

// Bulk create representatives from CSV/JSON
export const bulkCreateRepresentatives = action({
  args: {
    representatives: v.array(v.object({
      fullName: v.string(),
      email: v.string(),
      phone: v.string(),
      dateOfBirth: v.string(),
      nationality: v.string(),
      passportId: v.string(),
      iqamaId: v.optional(v.string()),
      password: v.string(),
      department: v.string(),
      title: v.string(),
      specializations: v.array(v.string()),
      maxAppointmentsPerDay: v.number(),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    created: v.number(),
    failed: v.number(),
    errors: v.array(v.object({
      email: v.string(),
      error: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    let created = 0;
    let failed = 0;
    const errors: { email: string; error: string }[] = [];

    for (const rep of args.representatives) {
      try {
        // Hash password with bcrypt
        const passwordHash = await bcrypt.hash(rep.password, 10);

        // Create user with representative role
        const userResult: {
          success: boolean;
          message: string;
          userId?: Id<"users">;
        } = await ctx.runMutation(internal.representativeHelpers.createRepresentativeUser, {
          fullName: rep.fullName,
          email: rep.email,
          phone: rep.phone,
          dateOfBirth: rep.dateOfBirth,
          nationality: rep.nationality,
          passportId: rep.passportId,
          iqamaId: rep.iqamaId,
          passwordHash,
        });

        if (!userResult.success || !userResult.userId) {
          failed++;
          errors.push({
            email: rep.email,
            error: userResult.message,
          });
          continue;
        }

        // Create representative profile
        const repResult: {
          success: boolean;
          message: string;
          representativeId?: Id<"representatives">;
        } = await ctx.runMutation(internal.representativeHelpers.createRepresentativeProfile, {
          userId: userResult.userId,
          department: rep.department,
          title: rep.title,
          specializations: rep.specializations,
          maxAppointmentsPerDay: rep.maxAppointmentsPerDay,
        });

        if (repResult.success) {
          created++;
        } else {
          failed++;
          errors.push({
            email: rep.email,
            error: repResult.message,
          });
        }
      } catch (error) {
        failed++;
        errors.push({
          email: rep.email,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: failed === 0,
      message: `Created ${created} representatives. ${failed} failed.`,
      created,
      failed,
      errors,
    };
  },
});