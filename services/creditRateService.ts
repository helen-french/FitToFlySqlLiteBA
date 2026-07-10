/**
 * @file creditRateService.ts
 * @description Database operations for staff credit rate history.
 *
 * Current rate = row with `effectiveTo` NULL. On change, the previous current
 * row is closed with `effectiveTo` set to today and a new row is inserted.
 */

import { db } from "@/db/db";
import { creditRates, type CreditRate } from "@/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

export function formatCreditRateDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCreditRatePeriod(record: CreditRate): string {
  const from = formatCreditRateDate(record.effectiveFrom);
  if (!record.effectiveTo) {
    return `${from} · Current`;
  }
  return `${from} · ${formatCreditRateDate(record.effectiveTo)}`;
}

export async function fetchCreditRatesForStaff(
  staffNumber: string,
): Promise<CreditRate[]> {
  if (!staffNumber.trim()) {
    return [];
  }

  return db
    .select()
    .from(creditRates)
    .where(eq(creditRates.staffNumber, staffNumber.trim()))
    .orderBy(desc(creditRates.createdAt));
}

export async function saveCreditRateChange(
  staffNumber: string,
  flyingRate: number,
  overseasRate: number,
  timeAwayRate: number,
): Promise<{ success: boolean; error?: string }> {
  const cleanStaffNumber = staffNumber.trim();
  if (!cleanStaffNumber) {
    return { success: false, error: "Staff number is required." };
  }

  if (
    [flyingRate, overseasRate, timeAwayRate].some(
      (rate) => !Number.isFinite(rate) || rate <= 0,
    )
  ) {
    return {
      success: false,
      error: "Enter valid amounts for flying, overseas, and TAFB rates.",
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  try {
    const [current] = await db
      .select()
      .from(creditRates)
      .where(
        and(
          eq(creditRates.staffNumber, cleanStaffNumber),
          isNull(creditRates.effectiveTo),
        ),
      )
      .limit(1);

    if (current) {
      await db
        .update(creditRates)
        .set({
          effectiveTo: today,
          updatedAt: now,
        })
        .where(eq(creditRates.id, current.id));
    }

    await db.insert(creditRates).values({
      staffNumber: cleanStaffNumber,
      flyingRate,
      overseasRate,
      timeAwayRate,
      effectiveFrom: today,
      effectiveTo: null,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save credit rates:", error);
    return { success: false, error: "Could not save credit rates." };
  }
}
