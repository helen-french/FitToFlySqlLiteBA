/**
 * Data hook for the Sectors screen.
 *
 * Owns SQLite access for resolving the active trip, prev/next navigation,
 * sector timeline (flights + layover stubs), and crew lookup.
 * Airport display names come from static `data/airport-codes.json` via
 * `getAirportByIataCode` (not the SQLite airports table). Names drop
 * "Airport" / "International" and append ", Country" (GB→UK, US→US).
 *
 * Parallel to `useDetailsTimeline` / `useHistoryLogs`: the screen owns map /
 * chrome / animation; this hook is the data source.
 *
 * Duration uses shared `computeTripDateSpan` → `getTripDurationDays` (same as
 * Details). Do not override with feed `TripLength` — that would diverge from
 * the Trip screen and collapse Local/Zulu into one number.
 */

import { useCallback, useEffect, useState } from "react";

import { formatAirportDisplayName, getAirportByIataCode } from "@/db/airport-queries";
import { db } from "@/db/db";
import {
  ActiveTripMeta,
  SectorItineraryItem,
  SectorsNavParams,
  UniqueStationItem,
} from "@/db/sectors-types";
import {
  crewMembers,
  duties,
  sectors,
  tripCrew,
  trips,
} from "@/db/schema";
import {
  computeTripDateSpan,
  getFormattedTimeDurationPT,
  getLocalTodayDateString,
  sumIsoDurationsPT,
} from "@/lib/utils";
import { and, asc, desc, eq, gt, gte, lt, lte } from "drizzle-orm";

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

function buildAirportNameMap(codes: string[]): Map<string, string> {
  const nameMap = new Map<string, string>();
  for (const code of codes) {
    const match = getAirportByIataCode(code)[0];
    if (match?.name) {
      nameMap.set(
        code,
        formatAirportDisplayName(match.name, match.isoCountry || match.country),
      );
    }
  }
  return nameMap;
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

      const todayDateStr = getLocalTodayDateString();

      // No deep-link trip: pick containing / next / previous vs today.
      if (!targetTripNumber) {
        let resolved = await db
          .select()
          .from(trips)
          .where(
            and(
              lte(trips.startDate, todayDateStr),
              gte(trips.endDate, todayDateStr),
            ),
          )
          .limit(1);

        if (resolved.length === 0) {
          resolved = await db
            .select()
            .from(trips)
            .where(gte(trips.startDate, todayDateStr))
            .orderBy(asc(trips.startDate))
            .limit(1);
        }

        if (resolved.length === 0) {
          resolved = await db
            .select()
            .from(trips)
            .where(lte(trips.endDate, todayDateStr))
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
          dutyHours: duties.dutyHours,
          dutyNumber: sectors.dutyNumber,
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

      // airport-codes.json via getAirportByIataCode — no SQLite airport load needed.
      // Values are already display-ready ("London Heathrow, UK").
      const nameMap = buildAirportNameMap(uniqueCodes);

      const uniqueStationsList: UniqueStationItem[] = uniqueCodes.map(
        (code) => {
          const displayName = nameMap.get(code) || code;
          return { code, fullNameClean: displayName };
        },
      );

      // Flight + one Turnaround between every consecutive pair of flights.
      // Turnaround window = previous arrival → next departure (Local/Zulu in mapper).
      const timeline: SectorItineraryItem[] = [];
      for (let i = 0; i < tripSectors.length; i++) {
        const currentSector = tripSectors[i];
        const currentLocDate = currentSector.departureTime.split("T")[0];

        const depName =
          nameMap.get(currentSector.departureStation) ||
          currentSector.departureStation;
        const arrName =
          nameMap.get(currentSector.arrivalStation) ||
          currentSector.arrivalStation;

        const flightData = {
          ...currentSector,
          departureNameClean: depName,
          arrivalNameClean: arrName,
        };

        timeline.push({
          type: "flight",
          dateStr: currentLocDate,
          data: flightData,
        });

        if (i < tripSectors.length - 1) {
          const nextSector = tripSectors[i + 1];
          const nextDepName =
            nameMap.get(nextSector.departureStation) ||
            nextSector.departureStation;
          const nextArrName =
            nameMap.get(nextSector.arrivalStation) ||
            nextSector.arrivalStation;

          timeline.push({
            type: "layover",
            dateStr: currentLocDate,
            turnaroundFrom: flightData,
            turnaroundTo: {
              ...nextSector,
              departureNameClean: nextDepName,
              arrivalNameClean: nextArrName,
            },
          });
        }
      }

      let localDurationDays = 1;
      let zuluDurationDays = 1;
      if (tripSectors.length > 0) {
        const span = computeTripDateSpan(
          tripSectors[0],
          tripSectors[tripSectors.length - 1],
        );
        targetStartDate = span.localStartDate;
        targetEndDate = span.localEndDate;
        localDurationDays = span.localDurationDays;
        zuluDurationDays = span.zuluDurationDays;
      } else {
        targetStartDate =
          targetStartDate || baselineTrip.startDate || todayDateStr;
        targetEndDate = targetEndDate || targetStartDate;
      }

      targetRouting =
        computeRoutingSummary(tripSectors) || targetRouting || "";

      const tripDuties = await db
        .select({
          flyingHours: duties.flyingHours,
          dutyHours: duties.dutyHours,
        })
        .from(duties)
        .where(eq(duties.tripNumber, targetTripNumber));

      const totalFlyingHoursLabel =
        getFormattedTimeDurationPT(
          sumIsoDurationsPT(tripDuties.map((duty) => duty.flyingHours)),
        ) ?? undefined;
      const totalDutyHoursLabel =
        getFormattedTimeDurationPT(
          sumIsoDurationsPT(tripDuties.map((duty) => duty.dutyHours)),
        ) ?? undefined;

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
        totalFlyingHoursLabel,
        totalDutyHoursLabel,
        uniqueStationsList,
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
