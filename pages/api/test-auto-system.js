import db from "../../models";
import AutoMealDeductions from "../../lib/serverOnly/autoMealDeductions";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Testing automatic meal deductions system...");
    
    const autoMealDeductions = new AutoMealDeductions();
    
    // Test the process
    const result = await autoMealDeductions.processAndSaveMealDeductions();
    
    res.status(200).json({
      success: true,
      result: result,
      message: result ? "Automatic meal deductions processed successfully" : "Automatic meal deductions processing failed"
    });

  } catch (error) {
    console.error("Error in test auto system:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 