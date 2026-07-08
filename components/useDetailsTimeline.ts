/**
 * Data hook for the Details (Trip) screen.
 *
 * Owns SQLite access and trip/ground hydration for the active roster
 * manifests. Returns rows ready for the Details FlatList.
 *
 * Parallel to `useHistoryLogs`: screen owns calendar / filters / expand /
 * Local-Zulu; this hook is a pure data source (+ reload).
 *
 * Walks active `dataLoad` → ordered `roster` index nodes:
 * - type T + tripNumber → trip meta, sectors (+ duty report time), pipe timeline
 * - type G + groundDutyId → ground duty row (+ credit)
 *
 * Trip pipe construction (UI can hide layovers via display options):
 * 1. flights in dep order
 * 2. insert day gaps as layover stubs when consecutive deps are >1 day apart
 * 3. consolidate consecutive layover days into one block + rest-hour estimate
 * 4. compute Local/Zulu duration via `getTripDurationDays`
 */

import { useCallback, useState } from "react";

import { db } from "@/db/db";
import {
  DetailsItineraryItem,
  UnifiedTimelineRow,
} from "@/db/details-types";
import {
  dataLoad,
  duties,
  groundDuties,
  roster,
  sectors,
  trips,
} from "@/db/schema";
import { getTripDurationDays } from "@/lib/utils";
import { and, asc, eq, inArray } from "drizzle-orm";

export function useDetailsTimeline() {
  const [isLoading, setIsLoading] = useState(true);
  const [timelineRows, setTimelineRows] = useState<UnifiedTimelineRow[]>([]);

  const loadSummaryData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Only manifests currently loaded into the app (not historical archives).
      const activeManifests = await db
        .select({ id: dataLoad.id })
        .from(dataLoad);
      if (activeManifests.length === 0) {
        setTimelineRows([]);
        setIsLoading(false);
        return;
      }

      const activeIds = activeManifests.map((m) => m.id);
      // Roster table is the chronological spine; each node points at T or G detail.
      const activeRosterTimeline = await db
        .select()
        .from(roster)
        .where(inArray(roster.dataLoadId, activeIds))
        .orderBy(asc(roster.startDate));

      const masterUnifiedRows: UnifiedTimelineRow[] = [];

      for (const indexNode of activeRosterTimeline) {
        // ── Trip node ──────────────────────────────────────────────────────
        if (indexNode.type === "T" && indexNode.tripNumber) {
          const tripTarget = await db
            .select()
            .from(trips)
            .where(eq(trips.tripNumber, indexNode.tripNumber))
            .limit(1);
          if (tripTarget.length === 0) continue;

          const currentTrip = tripTarget[0];

          // Sectors + report time from matching duty (join on trip+duty number).
          const tripSectors = await db
            .select({
              id: sectors.id,
              tripNumber: sectors.tripNumber,
              dutyNumber: sectors.dutyNumber,
              sectorNumber: sectors.sectorNumber,
              carrier: sectors.carrier,
              flightNumber: sectors.flightNumber,
              aircraftTypeSpecific: sectors.aircraftTypeSpecific,
              departureStation: sectors.departureStation,
              arrivalStation: sectors.arrivalStation,
              departureTime: sectors.departureTime,
              departureTimeLocal: sectors.departureTimeLocal,
              departureTimeShift: sectors.departureTimeShift,
              arrivalTime: sectors.arrivalTime,
              arrivalTimeLocal: sectors.arrivalTimeLocal,
              arrivalTimeShift: sectors.arrivalTimeShift,
              relativeDepartureDay: sectors.relativeDepartureDay,
              sectorType: sectors.sectorType,
              heavyCrewIdentifier: sectors.heavyCrewIdentifier,
              flyingHours: sectors.flyingHours,
              flyingHoursCredit: sectors.flyingHoursCredit,
              scheduleIndicator: sectors.scheduleIndicator,
              createdAt: sectors.createdAt,
              updatedAt: sectors.updatedAt,
              actualReportTime: duties.actualReportTime,
            })
            .from(sectors)
            .innerJoin(
              duties,
              and(
                eq(sectors.tripNumber, duties.tripNumber),
                eq(sectors.dutyNumber, duties.dutyNumber),
              ),
            )
            .where(eq(sectors.tripNumber, currentTrip.tripNumber))
            .orderBy(asc(sectors.departureTime), asc(sectors.sectorNumber));

          if (tripSectors.length === 0) continue;

          // Collapse consecutive identical stations → "LGW → JFK → LGW".
          const stations = [tripSectors[0].departureStation];
          tripSectors.forEach((s) => {
            if (stations[stations.length - 1] !== s.arrivalStation)
              stations.push(s.arrivalStation);
          });
          const routingSummary = stations.join(" → ");

          // Pass 1: flights + one layover stub per intervening calendar day.
          const rawTimeline: DetailsItineraryItem[] = [];
          for (let i = 0; i < tripSectors.length; i++) {
            const currentSector = tripSectors[i];
            const currentLocDate = currentSector.departureTime.split("T")[0];
            rawTimeline.push({
              type: "flight",
              dateStr: currentLocDate,
              data: currentSector,
            });

            if (i < tripSectors.length - 1) {
              const nextSector = tripSectors[i + 1];
              const nextLocDate = nextSector.departureTime.split("T")[0];
              const currentDateObj = new Date(`${currentLocDate}T12:00:00`);
              const nextDateObj = new Date(`${nextLocDate}T12:00:00`);

              if (
                !isNaN(currentDateObj.getTime()) &&
                !isNaN(nextDateObj.getTime())
              ) {
                const diffDays = Math.ceil(
                  Math.abs(nextDateObj.getTime() - currentDateObj.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                // Same-day / overnight turn without a blank calendar day → no layover.
                if (diffDays > 1) {
                  for (let d = 1; d < diffDays; d++) {
                    const layoverDate = new Date(currentDateObj);
                    layoverDate.setDate(currentDateObj.getDate() + d);
                    rawTimeline.push({
                      type: "layover",
                      dateStr: layoverDate.toISOString().split("T")[0],
                    });
                  }
                }
              }
            }
          }

          // Pass 2: merge consecutive layover days; estimate rest hours between
          // previous flight dep and next flight’s report (rough heuristic).
          const consolidatedTimeline: DetailsItineraryItem[] = [];
          let currentLayoverBlock: DetailsItineraryItem | null = null;

          for (let i = 0; i < rawTimeline.length; i++) {
            const currentItem = rawTimeline[i];

            if (currentItem.type === "flight") {
              if (currentLayoverBlock) {
                const nextFlightItem = currentItem;
                const prevFlightItem =
                  consolidatedTimeline[consolidatedTimeline.length - 1];

                if (
                  prevFlightItem?.type === "flight" &&
                  prevFlightItem.data &&
                  nextFlightItem?.data
                ) {
                  const depDatePart =
                    nextFlightItem.data.departureTime.split("T")[0];
                  const repTimePart =
                    nextFlightItem.data.actualReportTime || "00:00";

                  const endRestObj = new Date(
                    `${depDatePart}T${repTimePart}:00`,
                  );
                  const startRestObj = new Date(
                    prevFlightItem.data.departureTime,
                  );

                  if (
                    !isNaN(startRestObj.getTime()) &&
                    !isNaN(endRestObj.getTime())
                  ) {
                    const diffMs =
                      endRestObj.getTime() - startRestObj.getTime();
                    currentLayoverBlock.layoverDurationHours = Math.max(
                      0,
                      Math.floor(diffMs / (1000 * 60 * 60)),
                    );
                  }
                }

                consolidatedTimeline.push(currentLayoverBlock);
                currentLayoverBlock = null;
              }
              consolidatedTimeline.push(currentItem);
            } else {
              if (!currentLayoverBlock) {
                currentLayoverBlock = {
                  type: "layover",
                  dateStr: currentItem.dateStr,
                  endDateStr: currentItem.dateStr,
                };
              } else {
                currentLayoverBlock.endDateStr = currentItem.dateStr;
              }
            }
          }

          if (currentLayoverBlock) {
            consolidatedTimeline.push(currentLayoverBlock);
          }

          // Local/Zulu duration: shift first dep / last arr by sector day-shift.
          const firstSector = tripSectors[0];
          const lastSector = tripSectors[tripSectors.length - 1];

          const baseStartZuluStr = rawTimeline[0].dateStr;
          const baseEndZuluStr = rawTimeline[rawTimeline.length - 1].dateStr;

          const startShiftDays = firstSector.departureTimeShift
            ? parseInt(firstSector.departureTimeShift, 10) || 0
            : 0;
          const endShiftDays = lastSector.arrivalTimeShift
            ? parseInt(lastSector.arrivalTimeShift, 10) || 0
            : 0;

          const startLocalObj = new Date(`${baseStartZuluStr}T12:00:00`);
          if (!isNaN(startLocalObj.getTime()) && startShiftDays !== 0) {
            startLocalObj.setDate(startLocalObj.getDate() + startShiftDays);
          }

          const endLocalObj = new Date(`${baseEndZuluStr}T12:00:00`);
          if (!isNaN(endLocalObj.getTime()) && endShiftDays !== 0) {
            endLocalObj.setDate(endLocalObj.getDate() + endShiftDays);
          }

          const localStartStr = startLocalObj.toISOString().split("T")[0];
          const localEndStr = endLocalObj.toISOString().split("T")[0];
          const calculatedLocalDuration = getTripDurationDays(
            localStartStr,
            localEndStr,
          );
          const calculatedZuluDuration = getTripDurationDays(
            baseStartZuluStr,
            baseEndZuluStr,
          );

          masterUnifiedRows.push({
            id: `TRIP_${currentTrip.tripNumber}`,
            type: "T",
            startDate: indexNode.startDate,
            tripData: {
              tripMeta: currentTrip,
              routingSummary,
              timeline: consolidatedTimeline,
              calculatedStartDate: baseStartZuluStr,
              calculatedEndDate: baseEndZuluStr,
              trueLocalDurationDays: calculatedLocalDuration,
              trueZuluDurationDays: calculatedZuluDuration,
            },
          });
        } else if (indexNode.type === "G" && indexNode.groundDutyId) {
          // ── Ground duty node ─────────────────────────────────────────────
          const groundTarget = await db
            .select()
            .from(groundDuties)
            .where(eq(groundDuties.id, indexNode.groundDutyId))
            .limit(1);

          if (groundTarget.length === 0) continue;

          masterUnifiedRows.push({
            id: `GROUND_${groundTarget[0].id}`,
            type: "G",
            startDate: indexNode.startDate,
            groundData: {
              ...groundTarget[0],
              creditAmount: groundTarget[0].creditAmount || null,
            },
          });
        }
      }

      setTimelineRows(masterUnifiedRows);
    } catch (err) {
      console.error("Details timeline hydration failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    timelineRows,
    isLoading,
    reload: loadSummaryData,
  };
}
