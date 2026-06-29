/* This is strictly logic, no UI or styling.
It fetches and processes data (trips, dates, times) and hands over a clean list of "timeline items"  */

import { TimelineRow } from "@/constants/timeline";
import { db } from "@/db/db";
import { duties, sectors, trips } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { useCallback, useState } from "react";

export const useTripData = (currentViewMonth: Date) => {
  const [timelineRows, setTimelineRows] = useState<TimelineRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTripData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Define month range based on currentViewMonth
      const monthStart = new Date(
        currentViewMonth.getFullYear(),
        currentViewMonth.getMonth(),
        1,
      )
        .toISOString()
        .split("T")[0];
      const monthEnd = new Date(
        currentViewMonth.getFullYear(),
        currentViewMonth.getMonth() + 1,
        0,
      )
        .toISOString()
        .split("T")[0];

      // 2. Fetch all trips in the month
      const tripResults = await db
        .select()
        .from(trips)
        .where(
          and(gte(trips.startDate, monthStart), lte(trips.startDate, monthEnd)),
        );

      // 3. For each trip, fetch sectors and duties joined together
      const formattedRows: TimelineRow[] = await Promise.all(
        tripResults.map(async (trip) => {
          const sectorData = await db
            .select()
            .from(sectors)
            .leftJoin(
              duties,
              and(
                eq(sectors.tripNumber, duties.tripNumber),
                eq(sectors.dutyNumber, duties.dutyNumber),
              ),
            )
            .where(eq(sectors.tripNumber, trip.tripNumber));

          return {
            id: trip.tripNumber,
            type: "T",
            startDate: trip.startDate,
            tripData: {
              tripMeta: trip,
              routingSummary: `${sectorData[0]?.sectors.departureStation} → ${sectorData[sectorData.length - 1]?.sectors.arrivalStation}`,
              timeline: sectorData.map((s) => ({
                type: "flight",
                dateStr: s.sectors.departureTime.split("T")[0],
                data: {
                  ...s.sectors,
                  actualReportTime: s.duties?.actualReportTime,
                },
              })),
              calculatedStartDate: trip.startDate,
              calculatedEndDate: trip.endDate,
              trueLocalDurationDays: trip.tripLength || 0,
              trueZuluDurationDays: trip.tripLength || 0,
            },
          };
        }),
      );

      setTimelineRows(formattedRows);
    } catch (err) {
      console.error("Database query failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentViewMonth]);

  return { timelineRows, isLoading, loadTripData };
};
