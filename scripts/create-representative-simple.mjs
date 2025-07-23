#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import readline from "readline";
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

const client = new ConvexHttpClient(CONVEX_URL);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createRepresentative() {
  console.log("=== Create Embassy Representative Account ===\n");

  try {
    // Collect representative information
    const fullName = await question("Full Name: ");
    const email = await question("Email: ");
    const phone = await question("Phone: ");
    const dateOfBirth = await question("Date of Birth (YYYY-MM-DD): ");
    const nationality = await question("Nationality: ");
    const passportId = await question("Passport ID: ");
    const iqamaId = await question("Iqama ID (optional, press enter to skip): ");
    const password = await question("Password: ");
    
    console.log("\n--- Embassy Details ---");
    const department = await question("Department: ");
    const title = await question("Title: ");
    const specializationsInput = await question("Specializations (comma-separated): ");
    const specializations = specializationsInput.split(",").map(s => s.trim()).filter(s => s);
    const maxAppointmentsPerDay = parseInt(await question("Max Appointments Per Day: "));

    console.log("\nCreating representative account...");

    // Call the Convex action
    const result = await client.action("representativeActions:createRepresentative", {
      fullName,
      email,
      phone,
      dateOfBirth,
      nationality,
      passportId,
      iqamaId: iqamaId || undefined,
      password,
      department,
      title,
      specializations,
      maxAppointmentsPerDay,
    });

    if (result.success) {
      console.log("\n✅ Representative account created successfully!");
      console.log(`User ID: ${result.userId}`);
      console.log(`Representative ID: ${result.representativeId}`);
    } else {
      console.error("\n❌ Failed to create representative:", result.message);
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    rl.close();
  }
}

// Run the script
createRepresentative();