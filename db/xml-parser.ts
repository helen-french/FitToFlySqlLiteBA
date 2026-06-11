import { and, desc, eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import { db } from "./db";
// ──✅ Note the updated table import reference here:
import {
  crewMembers,
  duties,
  personDetails,
  sectors,
  tripCrew,
  trips,
} from "./schema";

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

// ──✅ Update verification helper to check against the master crew registry fields
function isCrewMemberIdentical(existing: any, incoming: any): boolean {
  return (
    String(existing.surname || "").trim() ===
      String(incoming.surname || "").trim() &&
    String(existing.initials || "").trim() ===
      String(incoming.initials || "").trim() &&
    String(existing.nameCode || "").trim() ===
      String(incoming.nameCode || "").trim() &&
    String(existing.aircraftType || "").trim() ===
      String(incoming.aircraftType || "").trim() &&
    String(existing.crewBase || "").trim() ===
      String(incoming.crewBase || "").trim()
  );
}

function calculateRelativeFlightDate(
  baseDateStr: string,
  relativeDays: number,
): string {
  try {
    if (!baseDateStr) return "";
    const date = new Date(baseDateStr);
    if (isNaN(date.getTime())) return baseDateStr;
    date.setDate(date.getDate() + relativeDays);
    return date.toISOString().split("T")[0];
  } catch {
    return baseDateStr;
  }
}

export async function loadRosterXmlData(fullRawContent: string) {
  try {
    console.log("🚀 Initializing Relational Aviation Parser...");
    const jsonObj = parser.parse(fullRawContent);

    let rosterMonth = "2026-05";
    const timestampString = new Date().toISOString();

    const incomingPeople: any[] = [];
    const incomingTrips: any[] = [];
    const incomingDuties: any[] = [];
    const incomingSectors: any[] = [];

    // Split incoming arrays to maintain relational segregation structures
    const incomingMasterCrew: any[] = [];
    const incomingTripAssignments: any[] = [];

    // ========================================================
    // PIPELINE 1: PARSE ROSTER FILE
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
    // PIPELINE 2: PARSE TRIP FILE
    // ========================================================
    const tripSpecification =
      jsonObj["tfs:TripFileSpecification"] || jsonObj["TripFileSpecification"];
    const tripBlock = tripSpecification?.TripBlock;
    const tripsArray = tripBlock?.Trip;

    if (tripsArray) {
      const formattedTrips = Array.isArray(tripsArray)
        ? tripsArray
        : [tripsArray];
      const aircraftType =
        tripBlock?.TripBlockHeader?.AircraftType?.toString() || "777";
      const crewBase =
        tripBlock?.TripBlockHeader?.CrewBase?.toString() || "LHR";

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

        // B. RELATIONAL FIX: Parse Crew Members inside their exact assigned Trip node
        const crewMembersElements = currentTrip?.TripCrewMember;
        if (crewMembersElements) {
          const formattedMembers = Array.isArray(crewMembersElements)
            ? crewMembersElements
            : [crewMembersElements];

          for (const member of formattedMembers) {
            const memberStaffNum = member.StaffNumber?.toString() || "";
            if (!memberStaffNum) continue;

            // ──✅ FIX: Add crewFunction and rosterMonth to the master crew object here
            incomingMasterCrew.push({
              staffNumber: memberStaffNum,
              surname: member.Surname?.toString() || "",
              initials: member.Initials?.toString() || "",
              nameCode: member.PilotNameCode?.toString() || "",
              crewFunction: member.CrewFunction
                ? parseInt(member.CrewFunction, 10)
                : null, // ──✅ Added
              aircraftType,
              crewBase,
              rosterMonth: rosterMonth, // ──✅ Added
              createdAt: timestampString,
              updatedAt: timestampString,
            });

            // Anchor relational pairings with exact assignment metadata tracking references
            incomingTripAssignments.push({
              tripNumber: currentTripNum,
              staffNumber: memberStaffNum,
              crewFunction: member.CrewFunction
                ? parseInt(member.CrewFunction, 10)
                : null,
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

                const offsetDays = sDetails.RelativeDepartureDay
                  ? parseInt(sDetails.RelativeDepartureDay, 10)
                  : 0;
                const calculatedFlightDate = calculateRelativeFlightDate(
                  tripStartDateStr,
                  offsetDays,
                );
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
                  departureTime: fullDepartureTimestamp,
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
      }
    }

    // 3. COMMIT DUTIES
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
      }
    }

    // 4. COMMIT SECTORS
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
      }
    }

    // 5. UPSERT UNIQUE CREW ASSETS INTO REGISTRY
    for (const crew of incomingMasterCrew) {
      const match = await db
        .select()
        .from(crewMembers)
        .where(eq(crewMembers.staffNumber, crew.staffNumber))
        .limit(1);
      if (match.length > 0) {
        if (!isCrewMemberIdentical(match[0], crew)) {
          await db
            .update(crewMembers)
            .set({ ...crew, updatedAt: timestampString })
            .where(eq(crewMembers.staffNumber, crew.staffNumber));
        }
      } else {
        await db.insert(crewMembers).values(crew);
      }
    }

    // 6. OVERWRITE PREVIOUS JUNCTION ASSIGNMENTS FOR CLEAN REFRESHES
    if (incomingTripAssignments.length > 0) {
      const targetTrips = [
        ...new Set(incomingTripAssignments.map((a) => a.tripNumber)),
      ];
      for (const tripId of targetTrips) {
        await db.delete(tripCrew).where(eq(tripCrew.tripNumber, tripId));
      }
      for (const assignment of incomingTripAssignments) {
        await db.insert(tripCrew).values(assignment);
      }
    }

    console.log(
      `🏁 Relational Chronology Tied! Ingested ${incomingTrips.length} Trips paired with ${incomingTripAssignments.length} Assignments.`,
    );
    return {
      tripIns: incomingTrips.length,
      dutyIns: incomingDuties.length,
      sectorIns: incomingSectors.length,
    };
  } catch (error: any) {
    console.error("❌ Relational Ingestion Engine Failure:", error);
    throw error;
  }
}
