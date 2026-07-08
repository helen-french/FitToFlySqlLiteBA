/**
 * Data hook for the Sectors screen.
 *
 * Owns SQLite access for resolving the active trip, prev/next navigation,
 * sector timeline (flights + layover stubs), airport names, and crew lookup.
 *
 * Parallel to `useDetailsTimeline` / `useHistoryLogs`: the screen owns map /
 * chrome / animation; this hook is the data source.
 *
 * Duration uses shared `computeTripDateSpan` → `getTripDurationDays` (same as
 * Details). Replaces the old hour-wrap shortcut that lived in the screen.
 *
 * DEV today-anchor matches Details (`2026-06-16`) until real “today” is wired.
 */

import { useCallback, useEffect, useState } from "react";

import { db } from "@/db/db";
import {
  ActiveTripMeta,
  SectorItineraryItem,
  SectorsNavParams,
  UniqueStationItem,
} from "@/db/sectors-types";
import {
  airports,
  crewMembers,
  duties,
  sectors,
  tripCrew,
  trips,
} from "@/db/schema";
import { computeTripDateSpan } from "@/lib/utils";
import { and, asc, desc, eq, gt, gte, inArray, lt, lte } from "drizzle-orm";

/** DEV: fixed “today” — keep in sync with Details todayAnchor. */
const TODAY_ANCHOR_STR = "2026-06-16";

function computeRoutingSummary(
  sectorRows: { departureStation: string; arrivalStation: string }[],
): string {
  if (sectorRows.length === 0) return "";
  const stations = [sectorRows[0].departureStation];
  sectorRows.forEach((s) => {
    if (stations[stations.length - 1] !== s.arrivalStation) {
      stations.push(s.arrivalStation);
    }
  });
  return stations.join(" → ");
}

function cleanAirportName(rawName: string): string {
  return rawName.replace(/airport|international/gi, "").trim();
}

export function useSectorsTrip(
  currentTripNumber: string | null,
  setCurrentTripNumber: (tripNumber: string | null) => void,
  params: SectorsNavParams,
) {
  const [activeTrip, setActiveTrip] = useState<ActiveTripMeta | null>(null);
  const [itineraryTimeline, setItineraryTimeline] = useState<
    SectorItineraryItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [prevTripNumber, setPrevTripNumber] = useState<string | null>(null);
  const [nextTripNumber, setNextTripNumber] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      let targetTripNumber = currentTripNumber;
      let targetStartDate = params.startDate;
      let targetEndDate = params.endDate;
      let targetRouting = params.routing;

      // No deep-link trip: pick containing / next / previous vs DEV today anchor.
      if (!targetTripNumber) {
        let resolved = await db
          .select()
          .from(trips)
          .where(
            and(
              lte(trips.startDate, TODAY_ANCHOR_STR),
              gte(trips.endDate, TODAY_ANCHOR_STR),
            ),
          )
          .limit(1);

        if (resolved.length === 0) {
          resolved = await db
            .select()
            .from(trips)
            .where(gte(trips.startDate, TODAY_ANCHOR_STR))
            .orderBy(asc(trips.startDate))
            .limit(1);
        }

        if (resolved.length === 0) {
          resolved = await db
            .select()
            .from(trips)
            .where(lte(trips.endDate, TODAY_ANCHOR_STR))
            .orderBy(desc(trips.endDate))
            .limit(1);
        }

        if (resolved.length > 0) {
          targetTripNumber = resolved[0].tripNumber;
          setCurrentTripNumber(targetTripNumber);
        }
      }

      if (!targetTripNumber) {
        setActiveTrip(null);
        setItineraryTimeline([]);
        setPrevTripNumber(null);
        setNextTripNumber(null);
        return;
      }

      const currentTripRow = await db
        .select()
        .from(trips)
        .where(eq(trips.tripNumber, targetTripNumber))
        .limit(1);

      if (currentTripRow.length === 0) {
        setActiveTrip(null);
        setItineraryTimeline([]);
        return;
      }
      const baselineTrip = currentTripRow[0];

      const previousTripLookup = await db
        .select({ tripNumber: trips.tripNumber })
        .from(trips)
        .where(lt(trips.startDate, baselineTrip.startDate))
        .orderBy(desc(trips.startDate))
        .limit(1);

      const nextTripLookup = await db
        .select({ tripNumber: trips.tripNumber })
        .from(trips)
        .where(gt(trips.startDate, baselineTrip.startDate))
        .orderBy(asc(trips.startDate))
        .limit(1);

      setPrevTripNumber(
        previousTripLookup.length > 0
          ? previousTripLookup[0].tripNumber
          : null,
      );
      setNextTripNumber(
        nextTripLookup.length > 0 ? nextTripLookup[0].tripNumber : null,
      );

      // Shifts needed for shared computeTripDateSpan (Details-aligned).
      const tripSectors = await db
        .select({
          id: sectors.id,
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
          actualReportTime: duties.actualReportTime,
          flyingHours: sectors.flyingHours,
        })
        .from(sectors)
        .innerJoin(
          duties,
          and(
            eq(sectors.tripNumber, duties.tripNumber),
            eq(sectors.dutyNumber, duties.dutyNumber),
          ),
        )
        .where(eq(sectors.tripNumber, targetTripNumber))
        .orderBy(asc(sectors.departureTime), asc(sectors.sectorNumber));

      const rawStationSequence: string[] = [];
      if (tripSectors.length > 0) {
        rawStationSequence.push(tripSectors[0].departureStation);
        tripSectors.forEach((s) => {
          if (
            rawStationSequence[rawStationSequence.length - 1] !==
            s.arrivalStation
          ) {
            rawStationSequence.push(s.arrivalStation);
          }
        });
      }

      const uniqueCodes = Array.from(new Set(rawStationSequence));

      let nameMap = new Map<string, string>();
      if (uniqueCodes.length > 0) {
        const airportRows = await db
          .select({ iataCode: airports.iataCode, name: airports.name })
          .from(airports)
          .where(inArray(airports.iataCode, uniqueCodes));
        nameMap = new Map(airportRows.map((r) => [r.iataCode, r.name]));
      }

      const uniqueStationsList: UniqueStationItem[] = uniqueCodes.map(
        (code) => {
          const rawName = nameMap.get(code) || code;
          return { code, fullNameClean: cleanAirportName(rawName) };
        },
      );

      const outfieldCodes =
        rawStationSequence.length > 2
          ? Array.from(new Set(rawStationSequence.slice(1, -1)))
          : [];

      const outfieldHotelsList: UniqueStationItem[] = outfieldCodes.map(
        (code) => {
          const rawName = nameMap.get(code) || code;
          return { code, fullNameClean: cleanAirportName(rawName) };
        },
      );

      // Flight + layover stubs (same day-gap rule as Details pass 1).
      const timeline: SectorItineraryItem[] = [];
      for (let i = 0; i < tripSectors.length; i++) {
        const currentSector = tripSectors[i];
        const currentLocDate = currentSector.departureTime.split("T")[0];

        const rawDepName =
          nameMap.get(currentSector.departureStation) ||
          currentSector.departureStation;
        const rawArrName =
          nameMap.get(currentSector.arrivalStation) ||
          currentSector.arrivalStation;

        timeline.push({
          type: "flight",
          dateStr: currentLocDate,
          data: {
            ...currentSector,
            departureNameClean: cleanAirportName(rawDepName),
            arrivalNameClean: cleanAirportName(rawArrName),
          },
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
            if (diffDays > 1) {
              for (let d = 1; d < diffDays; d++) {
                const layoverDate = new Date(currentDateObj);
                layoverDate.setDate(currentDateObj.getDate() + d);
                timeline.push({
                  type: "layover",
                  dateStr: layoverDate.toISOString().split("T")[0],
                });
              }
            }
          }
        }
      }

      let localDurationDays = 1;
      let zuluDurationDays = 1;
      if (tripSectors.length > 0) {
        const span = computeTripDateSpan(
          tripSectors[0],
          tripSectors[tripSectors.length - 1],
        );
        targetStartDate = span.zuluStartDate;
        targetEndDate = span.zuluEndDate;
        localDurationDays = span.localDurationDays;
        zuluDurationDays = span.zuluDurationDays;
      } else {
        targetStartDate =
          targetStartDate || baselineTrip.startDate || TODAY_ANCHOR_STR;
        targetEndDate = targetEndDate || targetStartDate;
      }

      targetRouting =
        computeRoutingSummary(tripSectors) || targetRouting || "";

      setActiveTrip({
        tripNumber: targetTripNumber,
        startDate: targetStartDate!,
        endDate: targetEndDate || targetStartDate!,
        routingSummary: targetRouting,
        // Default display matches Details local (TimeMode provider is Local by default).
        totalDays: localDurationDays,
        localDurationDays,
        zuluDurationDays,
        creditAmount: baselineTrip.creditAmount,
        uniqueStationsList,
        outfieldHotelsList,
      });

      setItineraryTimeline(timeline);
    } catch (err) {
      console.error("Sectors trip hydration failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentTripNumber, params.startDate, params.endDate, params.routing, setCurrentTripNumber]);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Crew alert payload for the active trip (DB lives here; Alert stays on screen). */
  const loadTripCrew = useCallback(async () => {
    if (!activeTrip?.tripNumber) return [];
    const assignedRosterCrew = await db
      .select({
        surname: crewMembers.surname,
        initials: crewMembers.initials,
        crewFunction: crewMembers.crewFunction,
      })
      .from(tripCrew)
      .innerJoin(
        crewMembers,
        eq(tripCrew.staffNumber, crewMembers.staffNumber),
      )
      .where(eq(tripCrew.tripNumber, activeTrip.tripNumber))
      .orderBy(asc(tripCrew.crewFunction));
    return assignedRosterCrew;
  }, [activeTrip?.tripNumber]);

  return {
    activeTrip,
    itineraryTimeline,
    isLoading,
    prevTripNumber,
    nextTripNumber,
    reload,
    loadTripCrew,
  };
}
