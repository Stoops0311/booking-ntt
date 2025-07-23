import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Set availability for a representative
export const setAvailability = mutation({
  args: {
    representativeId: v.id("representatives"),
    dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
    startTime: v.string(), // "09:00"
    endTime: v.string(), // "17:00"
    slotDuration: v.number(), // minutes (e.g., 30)
    breakTimes: v.array(
      v.object({
        start: v.string(),
        end: v.string(),
      })
    ),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    availabilityId: v.optional(v.id("availability")),
  }),
  handler: async (ctx, args) => {
    // Check if availability already exists for this day
    const existingAvailability = await ctx.db
      .query("availability")
      .withIndex("by_representative_and_day", (q) =>
        q.eq("representativeId", args.representativeId).eq("dayOfWeek", args.dayOfWeek)
      )
      .first();

    if (existingAvailability) {
      // Update existing availability
      await ctx.db.patch(existingAvailability._id, {
        startTime: args.startTime,
        endTime: args.endTime,
        slotDuration: args.slotDuration,
        breakTimes: args.breakTimes,
      });

      return {
        success: true,
        message: "Availability updated successfully",
        availabilityId: existingAvailability._id,
      };
    } else {
      // Create new availability
      const availabilityId = await ctx.db.insert("availability", {
        representativeId: args.representativeId,
        dayOfWeek: args.dayOfWeek,
        startTime: args.startTime,
        endTime: args.endTime,
        slotDuration: args.slotDuration,
        breakTimes: args.breakTimes,
      });

      return {
        success: true,
        message: "Availability created successfully",
        availabilityId,
      };
    }
  },
});

// Get availability for a representative
export const getRepresentativeAvailability = query({
  args: {
    representativeId: v.id("representatives"),
  },
  returns: v.array(
    v.object({
      _id: v.id("availability"),
      _creationTime: v.number(),
      representativeId: v.id("representatives"),
      dayOfWeek: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      slotDuration: v.number(),
      breakTimes: v.array(
        v.object({
          start: v.string(),
          end: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const availability = await ctx.db
      .query("availability")
      .withIndex("by_representative", (q) => q.eq("representativeId", args.representativeId))
      .collect();

    // Sort by day of week
    return availability.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  },
});

// Delete availability for a specific day
export const deleteAvailability = mutation({
  args: {
    representativeId: v.id("representatives"),
    dayOfWeek: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const availability = await ctx.db
      .query("availability")
      .withIndex("by_representative_and_day", (q) =>
        q.eq("representativeId", args.representativeId).eq("dayOfWeek", args.dayOfWeek)
      )
      .first();

    if (!availability) {
      return {
        success: false,
        message: "Availability not found",
      };
    }

    await ctx.db.delete(availability._id);

    return {
      success: true,
      message: "Availability deleted successfully",
    };
  },
});

// Get all representatives with their availability
export const getAllRepresentativesWithAvailability = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("representatives"),
      department: v.string(),
      title: v.string(),
      specializations: v.array(v.string()),
      maxAppointmentsPerDay: v.number(),
      user: v.object({
        fullName: v.string(),
        email: v.string(),
      }),
      availability: v.array(
        v.object({
          dayOfWeek: v.number(),
          startTime: v.string(),
          endTime: v.string(),
          slotDuration: v.number(),
        })
      ),
    })
  ),
  handler: async (ctx) => {
    const representatives = await ctx.db.query("representatives").collect();

    const representativesWithDetails = await Promise.all(
      representatives.map(async (rep) => {
        const user = await ctx.db.get(rep.userId);
        if (!user) {
          throw new Error("User not found for representative");
        }

        const availability = await ctx.db
          .query("availability")
          .withIndex("by_representative", (q) => q.eq("representativeId", rep._id))
          .collect();

        return {
          _id: rep._id,
          department: rep.department,
          title: rep.title,
          specializations: rep.specializations,
          maxAppointmentsPerDay: rep.maxAppointmentsPerDay,
          user: {
            fullName: user.fullName,
            email: user.email,
          },
          availability: availability.map((avail) => ({
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            slotDuration: avail.slotDuration,
          })),
        };
      })
    );

    return representativesWithDetails;
  },
});