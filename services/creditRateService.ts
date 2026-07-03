/**
 * @file creditRateService.ts
 * @description Handles database operations for user credit rates.
 * Includes logic for maintaining historical rate versions and active status.
 */

import { db } from "@/db/db";
import { creditRates } from "@/db/schema";

/**
 * Parse a user-entered effective date into ISO format for storage.
 * Supports both:
 *   - YYYY-MM-DD (already ISO)
 *   - DD/MM/YYYY or DD/MM/YY (user-friendly format)
 *
 * Returns null for invalid or out-of-range dates.
 */
const parseEffectiveDate = (input: string): string | null => {
  const trimmed = input.trim();
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/;
  if (isoMatch.test(trimmed)) {
    return trimmed;
  }

  const dmyMatch = /^([0-3]\d)\/([0-1]\d)\/(\d{2}|\d{4})$/;
  const match = trimmed.match(dmyMatch);
  if (!match) {
    return null;
  }

  let [, day, month, year] = match;
  if (year.length === 2) {
    year = String(2000 + Number(year));
  }

  const isoDate = `${year}-${month}-${day}`;
  const date = new Date(isoDate);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCDate() !== Number(day) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCFullYear() !== Number(year)
  ) {
    return null;
  }

  return isoDate;
};

/**
 * Persist a new credit-rate record for a given staff member.
 *
 * @param staffNo - crew staff number (stored in the credit_rates.staff_number column)
 * @param r1 - flying rate value to store in the flying_rate column
 * @param r2 - overseas rate value to store in the overseas_rate column
 * @param r3 - time away rate value to store in the time_away_rate column
 * @param effectiveTo - optional end date for this rate version, or undefined for indefinite
 */
export const saveCreditRates = async (
  staffNo: string,
  r1: number,
  r2: number,
  r3: number,
  effectiveTo?: string,
) => {
  const effectiveFrom = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  let effectiveToIso: string | undefined;
  if (effectiveTo) {
    const parsedEffectiveTo = parseEffectiveDate(effectiveTo);
    if (!parsedEffectiveTo) {
      return { success: false, error: "Invalid effectiveTo date format." };
    }
    effectiveToIso = parsedEffectiveTo;

    const fromDate = new Date(effectiveFrom);
    const toDate = new Date(effectiveToIso);

    if (toDate < fromDate) {
      return {
        success: false,
        error: "effectiveTo must be greater than or equal to effectiveFrom.",
      };
    }
  }

  try {
    // Build the insert payload to match the schema defined in db/schema.ts.
    // Drizzle validates these property names at compile time, so they must
    // exactly match the columns declared on the creditRates table.
    await db.insert(creditRates).values({
      staffNumber: staffNo,
      effectiveFrom,
      effectiveTo: effectiveToIso,
      flyingRate: r1,
      overseasRate: r2,
      timeAwayRate: r3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Return a simple success shape for callers.
    return { success: true };
  } catch (error) {
    // Log the DB error and return a failure shape for the UI or caller.
    console.error("Failed to save rates:", error);
    return { success: false, error };
  }
};
