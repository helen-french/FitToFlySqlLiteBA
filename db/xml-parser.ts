import { and, desc, eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import { db } from "./db";
import { duties, personDetails, sectors, tripCrew, trips } from "./schema";

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

function isPersonDetailsIdentical(existing: any, incoming: any): boolean {
  return (
    String(existing.surname || "").trim() ===
      String(incoming.surname || "").trim() &&
    String(existing.initials || "").trim() ===
      String(incoming.initials || "").trim() &&
    String(existing.nameCode || "").trim() ===
      String(incoming.nameCode || "").trim() &&
    Number(existing.seniorityNumber || 0) ===
      Number(incoming.seniorityNumber || 0) &&
    String(existing.individualCap || "").trim() ===
      String(incoming.individualCap || "").trim()
  );
}

function isTripCrewIdentical(existing: any, incoming: any): boolean {
  return (
    String(existing.surname || "").trim() ===
      String(incoming.surname || "").trim() &&
    String(existing.initials || "").trim() ===
      String(incoming.initials || "").trim() &&
    String(existing.nameCode || "").trim() ===
      String(incoming.nameCode || "").trim() &&
    Number(existing.crewFunction || 0) === Number(incoming.crewFunction || 0) &&
    String(existing.aircraftType || "").trim() ===
      String(incoming.aircraftType || "").trim() &&
    String(existing.crewBase || "").trim() ===
      String(incoming.crewBase || "").trim()
  );
}

// Helper function to safely calculate true calendar date from relative offset integers
function calculateRelativeFlightDate(
  baseDateStr: string,
  relativeDays: number,
): string {
  try {
    if (!baseDateStr) return "";
    const date = new Date(baseDateStr);
    if (isNaN(date.getTime())) return baseDateStr;

    // Perform localized calendar date shifting
    date.setDate(date.getDate() + relativeDays);

    // Format perfectly back to standard ISO "YYYY-MM-DD"
    return date.toISOString().split("T")[0];
  } catch {
    return baseDateStr;
  }
}

export async function loadRosterXmlData(fullRawContent: string) {
  try {
    console.log("🚀 Initializing Mathematically Anchored Aviation Parser...");
    const jsonObj = parser.parse(fullRawContent);

    let rosterMonth = "2026-06";
    const timestampString = new Date().toISOString();

    const incomingPeople: any[] = [];
    const incomingTrips: any[] = [];
    const incomingDuties: any[] = [];
    const incomingSectors: any[] = [];
    const incomingCrewSummaries: any[] = [];

    // ========================================================
    // PIPELINE 1: PARSE ROSTER FILE (Personal & Monthly Meta)
    // ========================================================
    const rosterSpecification = jsonObj["rfs:RosterFileSpecification"];
    if (rosterSpecification) {
      rosterMonth =
        rosterSpecification.RosterPeriod?.MonthNumber?.toString() ||
        rosterMonth;
      const personalDetails =
        rosterSpecification.RosterBlock?.RosterDetail?.PersonalDetails;
      if (personalDetails) {
        incomingPeople.push({
          staffNumber: personalDetails.StaffNumber?.toString() || "",
          surname: personalDetails.Surname?.toString() || "",
          initials: personalDetails.InitialsOfCrew?.toString() || "",
          nameCode: personalDetails.NameCode || "",
          seniorityNumber: personalDetails.SeniorityNumber
            ? parseInt(personalDetails.SeniorityNumber, 10)
            : null,
          individualCap: personalDetails.IndividualCAP?.toString() || "",
          createdAt: timestampString,
          updatedAt: timestampString,
        });
      }
    }

    // ========================================================
    // PIPELINE 2: PARSE TRIP FILE (Trips -> Duties -> Sectors)
    // ========================================================
    const tripSpecification =
      jsonObj["tfs:TripFileSpecification"] || jsonObj["TripFileSpecification"];
    const tripBlock = tripSpecification?.TripBlock;
    const tripsArray = tripBlock?.Trip;

    if (tripsArray) {
      const formattedTrips = Array.isArray(tripsArray)
        ? tripsArray
        : [tripsArray];

      for (const currentTrip of formattedTrips) {
        const details = currentTrip?.TripDetails;
        const spanDetails = currentTrip?.TripSpanDetails;
        if (!details) continue;

        const currentTripNum = details.TripNumber?.toString() || "";
        const tripStartDateStr = spanDetails?.StartDate?.toString() || "";

        const rawComp = details.CrewComplement;
        const compArray = Array.isArray(rawComp)
          ? rawComp
          : rawComp !== undefined
            ? [rawComp]
            : [];

        // A. Extract Parent Trip Node
        incomingTrips.push({
          tripNumber: currentTripNum,
          rosterMonth: rosterMonth,
          blockNumber: details.BlockNumber?.toString() || "",
          startDate: tripStartDateStr,
          endDate: spanDetails?.EndDate?.toString() || "",
          numberOfDuties: details.NumberOfDuties
            ? parseInt(details.NumberOfDuties, 10)
            : null,
          tripLength: details.TripLength
            ? parseInt(details.TripLength, 10)
            : null,
          heavyCrewIndicator: details.HeavyCrewIndicator?.toString() || "",
          base: details.Base?.toString() || "",
          localDayShift: details.LocalDayShift?.toString() || "",
          crewComplementPilots: compArray[0] ? parseInt(compArray[0], 10) : 0,
          crewComplementCabin: compArray[1] ? parseInt(compArray[1], 10) : 0,
          dayCodes: spanDetails?.DayCodes?.toString() || "",
          createdAt: timestampString,
          updatedAt: timestampString,
        });

        // B. Extract Trip Crew summaries for version logging
        const crewMembers = currentTrip?.TripCrewMember;
        if (crewMembers) {
          const formattedMembers = Array.isArray(crewMembers)
            ? crewMembers
            : [crewMembers];
          for (const member of formattedMembers) {
            incomingCrewSummaries.push({
              staffNumber: member.StaffNumber?.toString() || "",
              surname: member.Surname?.toString() || "",
              initials: member.Initials?.toString() || "",
              nameCode: member.PilotNameCode?.toString() || "",
              crewFunction: member.CrewFunction
                ? parseInt(member.CrewFunction, 10)
                : null,
              aircraftType:
                tripBlock?.TripBlockHeader?.AircraftType?.toString() || "777",
              crewBase:
                tripBlock?.TripBlockHeader?.CrewBase?.toString() || "LHR",
              rosterMonth: rosterMonth,
              createdAt: timestampString,
              updatedAt: timestampString,
            });
          }
        }

        // C. Drill down into individual Duty Days
        const dutiesArray = currentTrip?.Duty;
        if (dutiesArray) {
          const formattedDuties = Array.isArray(dutiesArray)
            ? dutiesArray
            : [dutiesArray];
          for (const currentDuty of formattedDuties) {
            const dDetails = currentDuty?.DutyDetails;
            if (!dDetails) continue;

            const currentDutyNum = dDetails.DutyNumber
              ? parseInt(dDetails.DutyNumber, 10)
              : 0;

            incomingDuties.push({
              tripNumber: currentTripNum,
              dutyNumber: currentDutyNum,
              dutyHours: dDetails.DutyHours?.toString() || "",
              flyingHours: dDetails.FlyingHours?.toString() || "",
              numberOfSectors: dDetails.NumberOfSectors
                ? parseInt(dDetails.NumberOfSectors, 10)
                : null,
              actualReportTime: dDetails.ActualReportTime?.toString() || "",
              industrialBriefTime:
                dDetails.IndustrialBriefTime?.toString() || "",
              industrialDebriefTime:
                dDetails.IndustrialDebriefTime?.toString() || "",
              schemeBriefTime: dDetails.SchemeBriefTime?.toString() || "",
              schemeDebriefTime: dDetails.SchemeDebriefTime?.toString() || "",
              createdAt: timestampString,
              updatedAt: timestampString,
            });

            // D. Drill down into individual flight leg Sectors
            const sectorsArray = currentDuty?.Sector;
            if (sectorsArray) {
              const formattedSectors = Array.isArray(sectorsArray)
                ? sectorsArray
                : [sectorsArray];
              for (const currentSector of formattedSectors) {
                const sDetails = currentSector?.SectorDetails;
                if (!sDetails) continue;

                // CRITICAL FIX: Calculate the exact ISO date for this flight leg using the relative offset
                const offsetDays = sDetails.RelativeDepartureDay
                  ? parseInt(sDetails.RelativeDepartureDay, 10)
                  : 0;
                const calculatedFlightDate = calculateRelativeFlightDate(
                  tripStartDateStr,
                  offsetDays,
                );

                // We override the departureTime column storage to combine date + time cleanly
                const fullDepartureTimestamp = calculatedFlightDate
                  ? `${calculatedFlightDate}T${sDetails.DepartureTime?.toString() || "00:00"}`
                  : sDetails.DepartureTime?.toString() || "";

                incomingSectors.push({
                  tripNumber: currentTripNum,
                  dutyNumber: currentDutyNum,
                  sectorNumber: sDetails.SectorNumber
                    ? parseInt(sDetails.SectorNumber, 10)
                    : 1,
                  carrier: sDetails.Carrier?.toString() || "",
                  flightNumber: sDetails.FlightNumber?.toString() || "",
                  aircraftTypeSpecific:
                    sDetails.AircraftTypeSpecific?.toString() || "",
                  departureStation: sDetails.DepartureStation?.toString() || "",
                  arrivalStation: sDetails.ArrivalStation?.toString() || "",
                  departureTime: fullDepartureTimestamp, // ──✅ Saved as an exact sortable timestamp!
                  departureTimeLocal:
                    sDetails.DepartureTimeLocal?.toString() || "",
                  departureTimeShift:
                    sDetails.DepartureTimeShift?.toString() || "",
                  arrivalTime: sDetails.ArrivalTime?.toString() || "",
                  arrivalTimeLocal: sDetails.ArrivalTimeLocal?.toString() || "",
                  arrivalTimeShift: sDetails.ArrivalTimeShift?.toString() || "",
                  relativeDepartureDay: offsetDays,
                  sectorType: sDetails.SectorType?.toString() || "",
                  heavyCrewIdentifier:
                    sDetails.HeavyCrewIdentifier?.toString() || "",
                  flyingHours: sDetails.FlyingHours?.toString() || "",
                  flyingHoursCredit:
                    sDetails.FlyingHoursCredit?.toString() || "",
                  scheduleIndicator:
                    sDetails.ScheduleIndicator?.toString() || "",
                  createdAt: timestampString,
                  updatedAt: timestampString,
                });
              }
            }
          }
        }
      }
    }

    // ========================================================
    // DATABASE INSERTS & ATOMIC UPSERTS
    // ========================================================

    // 1. COMMIT PERSON DETAILS
    for (const p of incomingPeople) {
      const match = await db
        .select()
        .from(personDetails)
        .where(eq(personDetails.staffNumber, p.staffNumber))
        .orderBy(desc(personDetails.updatedAt))
        .limit(1);
      if (match.length > 0 && isPersonDetailsIdentical(match[0], p)) {
        await db
          .update(personDetails)
          .set({ updatedAt: timestampString })
          .where(eq(personDetails.id, match[0].id));
      } else {
        await db.insert(personDetails).values(p);
      }
    }

    // 2. COMMIT TRIPS
    let tripIns = 0;
    for (const t of incomingTrips) {
      const match = await db
        .select()
        .from(trips)
        .where(eq(trips.tripNumber, t.tripNumber))
        .limit(1);
      if (match.length > 0) {
        await db
          .update(trips)
          .set({ ...t, updatedAt: timestampString })
          .where(eq(trips.tripNumber, t.tripNumber));
      } else {
        await db.insert(trips).values(t);
        tripIns++;
      }
    }

    // 3. COMMIT DUTIES
    let dutyIns = 0;
    for (const d of incomingDuties) {
      const match = await db
        .select()
        .from(duties)
        .where(
          and(
            eq(duties.tripNumber, d.tripNumber),
            eq(duties.dutyNumber, d.dutyNumber),
          ),
        )
        .limit(1);
      if (match.length > 0) {
        await db
          .update(duties)
          .set({ ...d, updatedAt: timestampString })
          .where(
            and(
              eq(duties.tripNumber, d.tripNumber),
              eq(duties.dutyNumber, d.dutyNumber),
            ),
          );
      } else {
        await db.insert(duties).values(d);
        dutyIns++;
      }
    }

    // 4. COMMIT SECTORS
    let sectorIns = 0;
    for (const s of incomingSectors) {
      const match = await db
        .select()
        .from(sectors)
        .where(
          and(
            eq(sectors.tripNumber, s.tripNumber),
            eq(sectors.dutyNumber, s.dutyNumber),
            eq(sectors.sectorNumber, s.sectorNumber),
          ),
        )
        .limit(1);
      if (match.length > 0) {
        await db
          .update(sectors)
          .set({ ...s, updatedAt: timestampString })
          .where(
            and(
              eq(sectors.tripNumber, s.tripNumber),
              eq(sectors.dutyNumber, s.dutyNumber),
              eq(sectors.sectorNumber, s.sectorNumber),
            ),
          );
      } else {
        await db.insert(sectors).values(s);
        sectorIns++;
      }
    }

    // 5. COMMIT TRIP CREW CO-WORKERS
    let crewIns = 0;
    for (const c of incomingCrewSummaries) {
      const match = await db
        .select()
        .from(tripCrew)
        .where(
          and(
            eq(tripCrew.staffNumber, c.staffNumber),
            eq(tripCrew.rosterMonth, c.rosterMonth),
          ),
        )
        .orderBy(desc(tripCrew.updatedAt))
        .limit(1);
      if (match.length > 0 && isTripCrewIdentical(match[0], c)) {
        await db
          .update(tripCrew)
          .set({ updatedAt: timestampString })
          .where(eq(tripCrew.id, match[0].id));
      } else {
        await db.insert(tripCrew).values(c);
        crewIns++;
      }
    }

    console.log(
      `🏁 Chronology Fixed! [Trips]: ${tripIns} | [Duties]: ${dutyIns} | [Sectors]: ${sectorIns}`,
    );
    return { tripIns, dutyIns, sectorIns };
  } catch (error: any) {
    console.error("❌ Parser Engine Crash:", error);
    throw error;
  }
}
