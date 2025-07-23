import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new appointment request
export const createAppointment = mutation({
  args: {
    userId: v.id("users"),
    representativeId: v.id("representatives"),
    requestedDate: v.string(), // "2024-01-15"
    requestedTime: v.string(), // "14:30"
    purpose: v.string(),
    description: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    appointmentId: v.optional(v.id("appointments")),
  }),
  handler: async (ctx, args) => {
    // Check if the user already has an appointment on the same date
    const existingAppointment = await ctx.db
      .query("appointments")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", args.userId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("requestedDate"), args.requestedDate))
      .first();

    if (existingAppointment) {
      return {
        success: false,
        message: "You already have a pending appointment on this date",
      };
    }

    // Check if the time slot is available
    const appointmentsOnDate = await ctx.db
      .query("appointments")
      .withIndex("by_representative_and_date", (q) =>
        q.eq("representativeId", args.representativeId).eq("requestedDate", args.requestedDate)
      )
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "accepted")
        )
      )
      .collect();

    const isTimeSlotTaken = appointmentsOnDate.some(
      (apt) => apt.requestedTime === args.requestedTime
    );

    if (isTimeSlotTaken) {
      return {
        success: false,
        message: "This time slot is already taken",
      };
    }

    // Create the appointment
    const appointmentId = await ctx.db.insert("appointments", {
      userId: args.userId,
      representativeId: args.representativeId,
      requestedDate: args.requestedDate,
      requestedTime: args.requestedTime,
      purpose: args.purpose,
      description: args.description,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Appointment request created successfully",
      appointmentId,
    };
  },
});

// Get available time slots for a representative on a specific date
export const getAvailableSlots = query({
  args: {
    representativeId: v.id("representatives"),
    date: v.string(), // "2024-01-15"
  },
  returns: v.array(v.string()), // ["09:00", "09:30", "10:00", ...]
  handler: async (ctx, args) => {
    // Get representative's availability for the day of week
    const dateObj = new Date(args.date);
    const dayOfWeek = dateObj.getDay(); // 0-6

    const availability = await ctx.db
      .query("availability")
      .withIndex("by_representative_and_day", (q) =>
        q.eq("representativeId", args.representativeId).eq("dayOfWeek", dayOfWeek)
      )
      .first();

    if (!availability) {
      return []; // No availability for this day
    }

    // Get all appointments for this date
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_representative_and_date", (q) =>
        q.eq("representativeId", args.representativeId).eq("requestedDate", args.date)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "accepted")
        )
      )
      .collect();

    const bookedSlots = appointments.map((apt) => apt.requestedTime);

    // Generate time slots
    const slots: string[] = [];
    const startTime = availability.startTime.split(":");
    const endTime = availability.endTime.split(":");
    const slotDuration = availability.slotDuration;

    let currentHour = parseInt(startTime[0]);
    let currentMinute = parseInt(startTime[1]);
    const endHour = parseInt(endTime[0]);
    const endMinute = parseInt(endTime[1]);

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute
        .toString()
        .padStart(2, "0")}`;

      // Check if this slot is in a break time
      let isInBreak = false;
      for (const breakTime of availability.breakTimes) {
        const breakStart = breakTime.start.split(":");
        const breakEnd = breakTime.end.split(":");
        const breakStartMinutes = parseInt(breakStart[0]) * 60 + parseInt(breakStart[1]);
        const breakEndMinutes = parseInt(breakEnd[0]) * 60 + parseInt(breakEnd[1]);
        const currentMinutes = currentHour * 60 + currentMinute;

        if (currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
          isInBreak = true;
          break;
        }
      }

      if (!isInBreak && !bookedSlots.includes(timeString)) {
        slots.push(timeString);
      }

      // Increment time
      currentMinute += slotDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    return slots;
  },
});

// Get appointments for a user
export const getUserAppointments = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("appointments"),
      representativeId: v.id("representatives"),
      requestedDate: v.string(),
      requestedTime: v.string(),
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
      representative: v.object({
        _id: v.id("representatives"),
        department: v.string(),
        title: v.string(),
        user: v.object({
          fullName: v.string(),
          email: v.string(),
        }),
      }),
    })
  ),
  handler: async (ctx, args) => {
    let appointmentsQuery = ctx.db
      .query("appointments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.status) {
      appointmentsQuery = appointmentsQuery.filter((q) =>
        q.eq(q.field("status"), args.status)
      );
    }

    const appointments = await appointmentsQuery.order("desc").collect();

    // Fetch representative details for each appointment
    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (appointment) => {
        const representative = await ctx.db.get(appointment.representativeId);
        if (!representative) {
          throw new Error("Representative not found");
        }

        const representativeUser = await ctx.db.get(representative.userId);
        if (!representativeUser) {
          throw new Error("Representative user not found");
        }

        return {
          _id: appointment._id,
          representativeId: appointment.representativeId,
          requestedDate: appointment.requestedDate,
          requestedTime: appointment.requestedTime,
          purpose: appointment.purpose,
          description: appointment.description,
          status: appointment.status,
          rejectionReason: appointment.rejectionReason,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          representative: {
            _id: representative._id,
            department: representative.department,
            title: representative.title,
            user: {
              fullName: representativeUser.fullName,
              email: representativeUser.email,
            },
          },
        };
      })
    );

    return appointmentsWithDetails;
  },
});

// Get appointments for a representative
export const getRepresentativeAppointments = query({
  args: {
    representativeId: v.id("representatives"),
    date: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("appointments"),
      userId: v.id("users"),
      requestedDate: v.string(),
      requestedTime: v.string(),
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
      user: v.object({
        _id: v.id("users"),
        fullName: v.string(),
        email: v.string(),
        phone: v.string(),
        nationality: v.string(),
      }),
    })
  ),
  handler: async (ctx, args) => {
    let appointmentsQuery = ctx.db
      .query("appointments")
      .withIndex("by_representative", (q) => q.eq("representativeId", args.representativeId));

    const appointments = await appointmentsQuery.collect();

    // Filter by date and status if provided
    let filteredAppointments = appointments;
    if (args.date) {
      filteredAppointments = filteredAppointments.filter(
        (apt) => apt.requestedDate === args.date
      );
    }
    if (args.status) {
      filteredAppointments = filteredAppointments.filter(
        (apt) => apt.status === args.status
      );
    }

    // Sort by date and time
    filteredAppointments.sort((a, b) => {
      const dateCompare = a.requestedDate.localeCompare(b.requestedDate);
      if (dateCompare !== 0) return dateCompare;
      return a.requestedTime.localeCompare(b.requestedTime);
    });

    // Fetch user details for each appointment
    const appointmentsWithDetails = await Promise.all(
      filteredAppointments.map(async (appointment) => {
        const user = await ctx.db.get(appointment.userId);
        if (!user) {
          throw new Error("User not found");
        }

        return {
          _id: appointment._id,
          userId: appointment.userId,
          requestedDate: appointment.requestedDate,
          requestedTime: appointment.requestedTime,
          purpose: appointment.purpose,
          description: appointment.description,
          status: appointment.status,
          rejectionReason: appointment.rejectionReason,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          user: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            nationality: user.nationality,
          },
        };
      })
    );

    return appointmentsWithDetails;
  },
});

// Update appointment status (for representatives)
export const updateAppointmentStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.union(
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    rejectionReason: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found",
      };
    }

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "rejected" && args.rejectionReason) {
      updateData.rejectionReason = args.rejectionReason;
    }

    if (args.notes) {
      updateData.notes = args.notes;
    }

    await ctx.db.patch(args.appointmentId, updateData);

    return {
      success: true,
      message: `Appointment ${args.status} successfully`,
    };
  },
});

// Cancel appointment (for users)
export const cancelAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found",
      };
    }

    if (appointment.userId !== args.userId) {
      return {
        success: false,
        message: "You can only cancel your own appointments",
      };
    }

    if (appointment.status !== "pending" && appointment.status !== "accepted") {
      return {
        success: false,
        message: "Only pending or accepted appointments can be cancelled",
      };
    }

    await ctx.db.patch(args.appointmentId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Appointment cancelled successfully",
    };
  },
});