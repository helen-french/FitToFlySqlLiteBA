/* Data hook for the Change History screen.

Owns all database access and hydration for roster amendments in a given month,
returning fully-formed rows ready for the presentational layer to render.
Sorting is intentionally left to the UI so this hook stays a pure data source. */

import { db } from "@/db/db";
import {
  dataLoad,
  duties,
  groundDuties,
  rosterAmendments,
  sectors,
  trips,
} from "@/db/schema";
import { HistoryItineraryItem, HydratedHistoryRow } from "@/db/history-types";
import { formatDisplayDate } from "@/components/history/historyUtils";
import { and, asc, desc, eq } from "drizzle-orm";
import { useCallback, useState } from "react";

function getRosterMonthKey(selectedMonth: Date): string {
  const targetYear = selectedMonth.getFullYear();
  const targetMonth = selectedMonth.getMonth();
  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;
}

export function useHistoryLogs(
  selectedMonth: Date,
  options?: { latestLoadOnly?: boolean },
) {
  const [isLoading, setIsLoading] = useState(true);
  const [historyRows, setHistoryRows] = useState<HydratedHistoryRow[]>([]);

  const loadHistoryLogs = useCallback(async () => {
    try {
      setIsLoading(true);

      const monthKey = getRosterMonthKey(selectedMonth);

      let baseAmendments: (typeof rosterAmendments.$inferSelect)[];

      if (options?.latestLoadOnly) {
        const latestMonthLoad = await db
          .select({ id: dataLoad.id })
          .from(dataLoad)
          .where(eq(dataLoad.rosterMonthNumber, monthKey))
          .orderBy(asc(dataLoad.id));

        if (latestMonthLoad.length === 0) {
          setHistoryRows([]);
          return;
        }

        const targetLoadId = latestMonthLoad[latestMonthLoad.length - 1].id;

        baseAmendments = await db
          .select()
          .from(rosterAmendments)
          .where(eq(rosterAmendments.dataLoadId, targetLoadId))
          .orderBy(desc(rosterAmendments.createdAt));
      } else {
        baseAmendments = await db
          .select()
          .from(rosterAmendments)
          .where(eq(rosterAmendments.rosterMonth, monthKey))
          .orderBy(desc(rosterAmendments.createdAt));
      }

      const compositeRows: HydratedHistoryRow[] = [];

      for (const am of baseAmendments) {
        // Sync date = the roster feed's DateOfCreation (dataLoad.rosterDateOfCreation),
        // i.e. when BA generated the feed that introduced this change — NOT the local
        // timestamp of when the amendment row was written. Left blank if the feed
        // date can't be resolved (the UI hides the line rather than showing a
        // misleading local date).
        let captureDate = "";

        const loadOrigin = await db
          .select({ rosterDate: dataLoad.rosterDateOfCreation })
          .from(dataLoad)
          .where(eq(dataLoad.id, am.dataLoadId))
          .limit(1);

        if (loadOrigin.length > 0 && loadOrigin[0].rosterDate) {
          captureDate = formatDisplayDate(loadOrigin[0].rosterDate);
        }

        const badgeColor =
          am.changeType === "C"
            ? "#34C759"
            : am.changeType === "D"
              ? "#FF3B30"
              : "#007AFF";
        const badgeLabel =
          am.changeType === "C"
            ? "ADDED"
            : am.changeType === "D"
              ? "REMOVED"
              : "CHANGED";

        let tripData: HydratedHistoryRow["tripData"] = undefined;
        let groundDutyData: HydratedHistoryRow["groundDutyData"] = undefined;
        let targetEventDateStr: string | null = null;

        if (am.itemType === "T" && am.identifier) {
          const tripQuery = await db
            .select()
            .from(trips)
            .where(eq(trips.tripNumber, am.identifier))
            .limit(1);

          if (tripQuery.length > 0) {
            const meta = tripQuery[0];

            // Baseline target setup directly from Trip master allocation data
            targetEventDateStr = meta.startDate;

            // Include local/zulu shift + flying-hours fields so History can
            // reuse useFlightTimeFormatter + shared roster pipe the same way
            // Details does. (Airport name lookup stays parked for now.)
            const sectorManifest = await db
              .select({
                id: sectors.id,
                tripNumber: sectors.tripNumber,
                dutyNumber: sectors.dutyNumber,
                sectorNumber: sectors.sectorNumber,
                carrier: sectors.carrier,
                flightNumber: sectors.flightNumber,
                departureStation: sectors.departureStation,
                arrivalStation: sectors.arrivalStation,
                departureTime: sectors.departureTime,
                departureTimeLocal: sectors.departureTimeLocal,
                departureTimeShift: sectors.departureTimeShift,
                arrivalTime: sectors.arrivalTime,
                arrivalTimeLocal: sectors.arrivalTimeLocal,
                arrivalTimeShift: sectors.arrivalTimeShift,
                flyingHours: sectors.flyingHours,
                actualReportTime: duties.actualReportTime,
              })
              .from(sectors)
              .leftJoin(
                duties,
                and(
                  eq(sectors.tripNumber, duties.tripNumber),
                  eq(sectors.dutyNumber, duties.dutyNumber),
                ),
              )
              .where(eq(sectors.tripNumber, meta.tripNumber))
              .orderBy(asc(sectors.departureTime), asc(sectors.sectorNumber));

            if (sectorManifest.length > 0) {
              const stations = [sectorManifest[0].departureStation];
              sectorManifest.forEach((s) => {
                if (stations[stations.length - 1] !== s.arrivalStation)
                  stations.push(s.arrivalStation);
              });

              const timeline: HistoryItineraryItem[] = [];
              for (let i = 0; i < sectorManifest.length; i++) {
                const currentSec = sectorManifest[i];
                const currentLocDate = currentSec.departureTime.split("T")[0];
                timeline.push({
                  type: "flight",
                  dateStr: currentLocDate,
                  data: currentSec as any,
                });

                if (i < sectorManifest.length - 1) {
                  const nextSec = sectorManifest[i + 1];
                  const nextLocDate = nextSec.departureTime.split("T")[0];
                  const d1 = new Date(`${currentLocDate}T12:00:00`);
                  const d2 = new Date(`${nextLocDate}T12:00:00`);

                  if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                    const diff = Math.ceil(
                      Math.abs(d2.getTime() - d1.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    if (diff > 1) {
                      for (let d = 1; d < diff; d++) {
                        const layoverDate = new Date(d1);
                        layoverDate.setDate(d1.getDate() + d);
                        timeline.push({
                          type: "layover",
                          dateStr: layoverDate.toISOString().split("T")[0],
                        });
                      }
                    }
                  }
                }
              }

              tripData = {
                startDateStr: timeline[0].dateStr,
                endDateStr: timeline[timeline.length - 1].dateStr,
                routingSummary: stations.join(" → "),
                timeline,
              };

              // Re-evaluate matching context strictly off parsed timeline bounds
              targetEventDateStr = timeline[0].dateStr;
            }
          }
        } else if (am.itemType === "G" && am.groundDutyId) {
          const gdQuery = await db
            .select()
            .from(groundDuties)
            .where(eq(groundDuties.id, am.groundDutyId))
            .limit(1);

          if (gdQuery.length > 0) {
            const gd = gdQuery[0];
            targetEventDateStr = gd.startDate;
            groundDutyData = {
              startDateStr: gd.startDate,
              endDateStr: gd.endDate,
              startTime: gd.startTime,
              endTime: gd.endTime,
              creditAmount: gd.creditAmount ?? "",
              code: gd.crewMovementCode,
            };
          }
        }

        // Canonical sort key: prefer the actual duty date, fall back to
        // the amendment's own creation date when no duty date resolved.
        const sortDate = targetEventDateStr ?? am.createdAt.split("T")[0];

        compositeRows.push({
          id: `AMEND_${am.id}`,
          amendment: am,
          captureDate,
          badgeColor,
          badgeLabel,
          sortDate,
          tripData, // undefined for Ground Duties
          groundDutyData, // undefined for Trips
        });
      }

      setHistoryRows(compositeRows);
    } catch (err) {
      console.error("Historical lookup synthesis loop failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, options?.latestLoadOnly]);

  return { historyRows, isLoading, reload: loadHistoryLogs };
}
