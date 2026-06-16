/**
 * Get the current sky type based on the time of day
 * Example: "2026-02-03T09:00:00Z" -> "09:00"
 */
export type SkyType = "night" | "day" | "day2" | "sunrise" | "sunset";
export const getSkyByTime = (): SkyType => {
  const hour = new Date().getHours();
  //const hour = 3; // Force it to night for testing
  if (hour >= 5 && hour < 9) return "sunrise"; // 5am - 8:59am
  if (hour >= 9 && hour < 17) return "day"; // 9am - 1:59pm
  //if (hour >= 14 && hour < 17) return "day2"; // 2pm - 4:59pm
  if (hour >= 17 && hour < 22) return "sunset"; // 5pm - 9:59pm
  return "night"; // 10pm - 4:59am
};
