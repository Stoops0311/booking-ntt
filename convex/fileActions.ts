"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

// Validate file upload (check size and type)
export const validateFile = action({
  args: {
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    uploadType: v.union(
      v.literal("profilePhoto"),
      v.literal("passport"),
      v.literal("visa")
    ),
  },
  returns: v.object({
    valid: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ALLOWED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

    // Check file size
    if (args.fileSize > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: "File size must be less than 5MB",
      };
    }

    // Check file type based on upload type
    if (args.uploadType === "profilePhoto") {
      if (!ALLOWED_IMAGE_TYPES.includes(args.fileType)) {
        return {
          valid: false,
          message: "Profile photo must be an image (JPEG, PNG, or WebP)",
        };
      }
    } else {
      if (!ALLOWED_DOC_TYPES.includes(args.fileType)) {
        return {
          valid: false,
          message: "Document must be a PDF or image (JPEG, PNG)",
        };
      }
    }

    return {
      valid: true,
      message: "File is valid",
    };
  },
});