import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    dateOfBirth: v.string(),
    nationality: v.string(),
    passportId: v.string(),
    iqamaId: v.optional(v.string()),
    passwordHash: v.string(),
    profilePhotoId: v.optional(v.id("_storage")),
    passportDocId: v.optional(v.id("_storage")),
    visaDocId: v.optional(v.id("_storage")),
    role: v.union(v.literal("user"), v.literal("representative")),
    isEmailVerified: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  representatives: defineTable({
    userId: v.id("users"),
    department: v.string(),
    title: v.string(),
    specializations: v.array(v.string()),
    maxAppointmentsPerDay: v.number(),
  })
    .index("by_userId", ["userId"]),

  availability: defineTable({
    representativeId: v.id("representatives"),
    dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
    startTime: v.string(), // "09:00"
    endTime: v.string(), // "17:00"
    slotDuration: v.number(), // minutes
    breakTimes: v.array(
      v.object({
        start: v.string(),
        end: v.string(),
      })
    ),
  })
    .index("by_representative", ["representativeId"])
    .index("by_representative_and_day", ["representativeId", "dayOfWeek"]),

  appointments: defineTable({
    userId: v.id("users"),
    representativeId: v.id("representatives"),
    requestedDate: v.string(), // "2024-01-15"
    requestedTime: v.string(), // "14:30"
    purpose: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    rejectionReason: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_representative", ["representativeId"])
    .index("by_status", ["status"])
    .index("by_representative_and_date", ["representativeId", "requestedDate"])
    .index("by_user_and_status", ["userId", "status"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),
});