import { and, desc, eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import { db } from "../app/_layout";
import { crew } from "./schema";

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

/**
 * FIXED DEEP EQUALITY CHECKER:
 * Explicitly sanitizes and type-casts values before comparing them.
 */
function isCrewDataIdentical(existing: any, incoming: any): boolean {
  const existingSeniority =
    existing.seniorityNumber !== null ? Number(existing.seniorityNumber) : null;
  const incomingSeniority =
    incoming.seniorityNumber !== null && incoming.seniorityNumber !== ""
      ? Number(incoming.seniorityNumber)
      : null;

  const existingFunction =
    existing.crewFunction !== null ? Number(existing.crewFunction) : null;
  const incomingFunction =
    incoming.crewFunction !== null && incoming.crewFunction !== ""
      ? Number(incoming.crewFunction)
      : null;

  return (
    String(existing.surname || "").trim() ===
      String(incoming.surname || "").trim() &&
    String(existing.firstname || "").trim() ===
      String(incoming.firstname || "").trim() &&
    String(existing.initials || "").trim() ===
      String(incoming.initials || "").trim() &&
    String(existing.nameCode || "").trim() ===
      String(incoming.nameCode || "").trim() &&
    existingFunction === incomingFunction &&
    existingSeniority === incomingSeniority &&
    String(existing.aircraftType || "").trim() ===
      String(incoming.aircraftType || "").trim() &&
    String(existing.crewBase || "").trim() ===
      String(incoming.crewBase || "").trim() &&
    String(existing.individualCap || "").trim() ===
      String(incoming.individualCap || "").trim()
  );
}

export async function loadRosterXmlData(fullRawContent: string) {
  try {
    console.log("🚀 Running Auditing Parser on Dynamic File Stream...");
    const jsonObj = parser.parse(fullRawContent);

    let rosterMonth = "2026-05";
    let insertedRows = 0;
    let updatedRows = 0;

    const rawPayloads: any[] = [];

    // 1. EXTRACT ROSTER TRACK
    const rosterSpecification = jsonObj["rfs:RosterFileSpecification"];
    if (rosterSpecification) {
      rosterMonth =
        rosterSpecification.RosterPeriod?.MonthNumber?.toString() ||
        rosterMonth;
      const rosterBlock = rosterSpecification.RosterBlock;
      const aircraftType =
        rosterBlock?.FleetType?.AircraftType?.toString() || "Unknown";
      const crewBase =
        rosterBlock?.FleetType?.CrewBase?.toString() || "Unknown";
      const crewFunctionCode = rosterBlock?.FleetType?.CrewFunction
        ? parseInt(rosterBlock.FleetType.CrewFunction, 10)
        : null;

      const personalDetails = rosterBlock?.RosterDetail?.PersonalDetails;
      if (personalDetails) {
        rawPayloads.push({
          staffNumber: personalDetails.StaffNumber?.toString() || "",
          surname: personalDetails.Surname?.toString() || "",
          firstname: personalDetails.FirstName?.toString() || "",
          initials: personalDetails.InitialsOfCrew?.toString() || "",
          nameCode: personalDetails.NameCode || "",
          crewFunction: crewFunctionCode,
          seniorityNumber: personalDetails.SeniorityNumber
            ? parseInt(personalDetails.SeniorityNumber, 10)
            : null,
          aircraftType: aircraftType,
          crewBase: crewBase,
          rosterMonth: rosterMonth,
          individualCap: personalDetails.IndividualCAP?.toString() || "",
        });
      }
    }

    // 2. EXTRACT TRIP TRACK
    const tripSpecification =
      jsonObj["tfs:TripFileSpecification"] || jsonObj["TripFileSpecification"];
    const tripBlock = tripSpecification?.TripBlock;
    const tripsArray = tripBlock?.Trip;

    if (tripsArray) {
      const formattedTrips = Array.isArray(tripsArray)
        ? tripsArray
        : [tripsArray];
      const fallbackAircraft =
        tripBlock?.TripBlockHeader?.AircraftType?.toString() || "777";
      const fallbackBase =
        tripBlock?.TripBlockHeader?.CrewBase?.toString() || "LHR";

      for (const currentTrip of formattedTrips) {
        const crewMembers = currentTrip?.TripCrewMember;
        if (!crewMembers) continue;

        const formattedMembers = Array.isArray(crewMembers)
          ? crewMembers
          : [crewMembers];
        for (const member of formattedMembers) {
          const colleagueStaffNum = member.StaffNumber?.toString() || "";
          if (!colleagueStaffNum) continue;

          rawPayloads.push({
            staffNumber: colleagueStaffNum,
            surname: member.Surname?.toString() || "",
            firstname: member.FirstName?.toString() || "",
            initials: member.Initials?.toString() || "",
            nameCode:
              member.PilotNameCode?.toString() || member.PilotNameCode || "",
            crewFunction: member.CrewFunction
              ? parseInt(member.CrewFunction, 10)
              : null,
            seniorityNumber: null,
            aircraftType: fallbackAircraft,
            crewBase: fallbackBase,
            rosterMonth: rosterMonth,
            individualCap: "",
          });
        }
      }
    }

    // 3. DATABASE UPSERT PIPELINE WITH FIXED COMPARISONS
    for (const incoming of rawPayloads) {
      const existingRecords = await db
        .select()
        .from(crew)
        .where(
          and(
            eq(crew.staffNumber, incoming.staffNumber),
            eq(crew.rosterMonth, incoming.rosterMonth),
          ),
        )
        .orderBy(desc(crew.updatedAt))
        .limit(1)
        .execute();

      if (existingRecords.length > 0) {
        const latestRecord = existingRecords[0];

        if (isCrewDataIdentical(latestRecord, incoming)) {
          await db
            .update(crew)
            .set({ updatedAt: new Date() })
            .where(eq(crew.id, latestRecord.id))
            .execute();
          updatedRows++;
        } else {
          await db.insert(crew).values(incoming).execute();
          console.log(
            `⚡ Change Detected! Created a new history row for ${incoming.surname}`,
          );
          insertedRows++;
        }
      } else {
        await db.insert(crew).values(incoming).execute();
        insertedRows++;
      }
    }

    return { insertedRows, updatedRows };
  } catch (error: any) {
    console.error("❌ Auditing engine error:", error);
    throw error;
  }
}
