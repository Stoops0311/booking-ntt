#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  process.exit(1);
}

console.log("Convex URL:", CONVEX_URL);

const client = new ConvexHttpClient(CONVEX_URL);

// Test with a simple query first
async function test() {
  try {
    // Test if we can connect to Convex
    console.log("Testing Convex connection...");
    
    // Try to call a simple query
    const result = await client.query("availability:getAllRepresentativesWithAvailability", {});
    console.log("✅ Connection successful!");
    console.log("Representatives found:", result.length);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

test();