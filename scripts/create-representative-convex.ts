// Run this script with: npx convex run scripts/create-representative-convex.ts

import { api } from "../convex/_generated/api";
import { createRepresentative } from "../convex/representativeActions";

// Representative data - modify this as needed
const representativeData = {
  fullName: "Nuaym Embassy Rep",
  email: "nuaym@nuaym.co.uk",
  phone: "1234567890",
  dateOfBirth: "2007-03-11",
  nationality: "Indian",
  passportId: "1234567890",
  iqamaId: undefined,
  password: "Khan0311",
  department: "dep 1",
  title: "wow wow big important person",
  specializations: ["Important", "very cool human"],
  maxAppointmentsPerDay: 10,
};

// This will be executed by Convex
export default async function run() {
  console.log("Creating representative account...");
  
  try {
    // Call the createRepresentative action
    const result = await createRepresentative(representativeData);
    
    if (result.success) {
      console.log("✅ Representative account created successfully!");
      console.log(`User ID: ${result.userId}`);
      console.log(`Representative ID: ${result.representativeId}`);
    } else {
      console.error("❌ Failed to create representative:", result.message);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}