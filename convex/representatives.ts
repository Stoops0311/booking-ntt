import { v } from "convex/values";
import { query } from "./_generated/server";

// Get representative profile by user ID
export const getRepresentativeByUserId = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("representatives"),
      _creationTime: v.number(),
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