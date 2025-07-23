import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Upload file and create storage entry
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Store file reference after upload
export const storeFileReference = mutation({
  args: {
    storageId: v.id("_storage"),
    userId: v.id("users"),
    fileType: v.union(
      v.literal("profilePhoto"),
      v.literal("passport"),
      v.literal("visa")
    ),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the file metadata
    const file = await ctx.db.system.get(args.storageId);
    if (!file) {
      return {
        success: false,
        message: "File not found",
      };
    }

    // Update user record with file reference
    const updateData: any = {};
    switch (args.fileType) {
      case "profilePhoto":
        updateData.profilePhotoId = args.storageId;
        break;
      case "passport":
        updateData.passportDocId = args.storageId;
        break;
      case "visa":
        updateData.visaDocId = args.storageId;
        break;
    }

    await ctx.db.patch(args.userId, updateData);

    return {
      success: true,
      message: `${args.fileType} uploaded successfully`,
    };
  },
});

// Get file URL
export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Get user files
export const getUserFiles = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    profilePhoto: v.union(v.null(), v.string()),
    passport: v.union(v.null(), v.string()),
    visa: v.union(v.null(), v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        profilePhoto: null,
        passport: null,
        visa: null,
      };
    }

    const result = {
      profilePhoto: null as string | null,
      passport: null as string | null,
      visa: null as string | null,
    };

    if (user.profilePhotoId) {
      result.profilePhoto = await ctx.storage.getUrl(user.profilePhotoId);
    }
    if (user.passportDocId) {
      result.passport = await ctx.storage.getUrl(user.passportDocId);
    }
    if (user.visaDocId) {
      result.visa = await ctx.storage.getUrl(user.visaDocId);
    }

    return result;
  },
});

// Delete file
export const deleteFile = mutation({
  args: {
    userId: v.id("users"),
    fileType: v.union(
      v.literal("profilePhoto"),
      v.literal("passport"),
      v.literal("visa")
    ),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    let storageId: string | undefined;
    const updateData: any = {};

    switch (args.fileType) {
      case "profilePhoto":
        storageId = user.profilePhotoId;
        updateData.profilePhotoId = undefined;
        break;
      case "passport":
        storageId = user.passportDocId;
        updateData.passportDocId = undefined;
        break;
      case "visa":
        storageId = user.visaDocId;
        updateData.visaDocId = undefined;
        break;
    }

    if (storageId) {
      await ctx.storage.delete(storageId);
    }

    await ctx.db.patch(args.userId, updateData);

    return {
      success: true,
      message: `${args.fileType} deleted successfully`,
    };
  },
});

// Export the validateFile action from fileActions.ts
export { validateFile } from "./fileActions";