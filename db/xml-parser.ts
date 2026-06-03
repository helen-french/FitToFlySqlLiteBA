import { and, desc, eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import { db } from "../app/_layout";
import { personDetails, tripCrew } from "./schema";

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

/**
 * DEEP EQUALITY CHECKER - personDetails Table:
 * Verifies if the master profile properties have experienced a change.
 */
function isPersonDetailsIdentical(existing: any, incoming: any): boolean {
  const existingSeniority =
    existing.seniorityNumber !== null ? Number(existing.seniorityNumber) : null;
  const incomingSeniority =
    incoming.seniorityNumber !== null && incoming.seniorityNumber !== ""
      ? Number(incoming.seniorityNumber)
      : null;

  return (
    String(existing.surname || "").trim() ===
      String(incoming.surname || "").trim() &&
    String(existing.initials || "").trim() ===
      String(incoming.initials || "").trim() &&
    String(existing.nameCode || "").trim() ===
      String(incoming.nameCode || "").trim() &&
    existingSeniority === incomingSeniority &&
    String(existing.individualCap || "").trim() ===
      String(incoming.individualCap || "").trim()
  );
}

/**
 * DEEP EQUALITY CHECKER - tripCrew Table:
 * Verifies if operational stats or pairing information for this month have experienced a change.
 */
function isTripCrewIdentical(existing: any, incoming: any): boolean {
  const existingFunction =
    existing.crewFunction !== null ? Number(existing.crewFunction) : null;
  const incomingFunction =
    incoming.crewFunction !== null && incoming.crewFunction !== ""
      ? Number(incoming.crewFunction)
      : null;

  return (
    String(existing.surname || "").trim() ===
      String(incoming.surname || "").trim() &&
    String(existing.initials || "").trim() ===
      String(incoming.initials || "").trim() &&
    String(existing.nameCode || "").trim() ===
      String(incoming.nameCode || "").trim() &&
    existingFunction === incomingFunction &&
    String(existing.aircraftType || "").trim() ===
      String(incoming.aircraftType || "").trim() &&
    String(existing.crewBase || "").trim() ===
      String(incoming.crewBase || "").trim()
  );
}

export async function loadRosterXmlData(fullRawContent: string) {
  try {
    console.log("🚀 Starting Normalized Multi-Table XML Ingestion Core...");
    const jsonObj = parser.parse(fullRawContent);

    let rosterMonth = "2026-05";
    let personInserts = 0,
      personUpdates = 0;
    let tripInserts = 0,
      tripUpdates = 0;

    const incomingPeople: any[] = [];
    const incomingTrips: any[] = [];

    // ========================================================
    // PIPELINE 1: EXTRACT ROSTER BLOCK (MASTER OWNER)
    // ========================================================
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
        const staffNum = personalDetails.StaffNumber?.toString() || "";

        // Collect into personDetails array tracking payload
        incomingPeople.push({
          staffNumber: staffNum,
          surname: personalDetails.Surname?.toString() || "",
          initials: personalDetails.InitialsOfCrew?.toString() || "",
          nameCode: personalDetails.NameCode || "",
          seniorityNumber: personalDetails.SeniorityNumber
            ? parseInt(personalDetails.SeniorityNumber, 10)
            : null,
          individualCap: personalDetails.IndividualCAP?.toString() || "",
        });

        // The master pilot ALSO gets an active operational row log entry for this month inside tripCrew
        incomingTrips.push({
          staffNumber: staffNum,
          surname: personalDetails.Surname?.toString() || "",
          initials: personalDetails.InitialsOfCrew?.toString() || "",
          nameCode: personalDetails.NameCode || "",
          crewFunction: crewFunctionCode,
          aircraftType: aircraftType,
          crewBase: crewBase,
          rosterMonth: rosterMonth,
        });
      }
    }

    // ========================================================
    // PIPELINE 2: EXTRACT TRIP BLOCK (FLIGHT PAIRING COLLEAGUES)
    // ========================================================
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

          // Pairing colleagues go straight to our incomingTrips tracking collection
          incomingTrips.push({
            staffNumber: colleagueStaffNum,
            surname: member.Surname?.toString() || "",
            initials: member.Initials?.toString() || "",
            nameCode:
              member.PilotNameCode?.toString() || member.PilotNameCode || "",
            crewFunction: member.CrewFunction
              ? parseInt(member.CrewFunction, 10)
              : null,
            aircraftType: fallbackAircraft,
            crewBase: fallbackBase,
            rosterMonth: rosterMonth,
          });
        }
      }
    }

    // ========================================================
    // ROUTER EXECUTION A: PROCESS INDIVIDUALS (person_details)
    // ========================================================
    for (const incomingPerson of incomingPeople) {
      const existingPeople = await db
        .select()
        .from(personDetails)
        .where(eq(personDetails.staffNumber, incomingPerson.staffNumber))
        .orderBy(desc(personDetails.updatedAt))
        .limit(1)
        .execute();

      if (existingPeople.length > 0) {
        const latestPerson = existingPeople[0];
        if (isPersonDetailsIdentical(latestPerson, incomingPerson)) {
          await db
            .update(personDetails)
            .set({ updatedAt: new Date() })
            .where(eq(personDetails.id, latestPerson.id))
            .execute();
          personUpdates++;
        } else {
          await db.insert(personDetails).values(incomingPerson).execute();
          console.log(
            `⚡ Profile Modification Detected! Created new history node for: ${incomingPerson.surname}`,
          );
          personInserts++;
        }
      } else {
        await db.insert(personDetails).values(incomingPerson).execute();
        personInserts++;
      }
    }

    // ========================================================
    // ROUTER EXECUTION B: PROCESS ROSTERS (trip_crew)
    // ========================================================
    for (const incomingTrip of incomingTrips) {
      const existingTrips = await db
        .select()
        .from(tripCrew)
        .where(
          and(
            eq(tripCrew.staffNumber, incomingTrip.staffNumber),
            eq(tripCrew.rosterMonth, incomingTrip.rosterMonth),
          ),
        )
        .orderBy(desc(tripCrew.updatedAt))
        .limit(1)
        .execute();

      if (existingTrips.length > 0) {
        const latestTrip = existingTrips[0];
        if (isTripCrewIdentical(latestTrip, incomingTrip)) {
          await db
            .update(tripCrew)
            .set({ updatedAt: new Date() })
            .where(eq(tripCrew.id, latestTrip.id))
            .execute();
          tripUpdates++;
        } else {
          await db.insert(tripCrew).values(incomingTrip).execute();
          console.log(
            `⚡ Monthly Roster Change Detected! Logged new timeline entry for: ${incomingTrip.surname}`,
          );
          tripInserts++;
        }
      } else {
        await db.insert(tripCrew).values(incomingTrip).execute();
        tripInserts++;
      }
    }

    console.log(
      `🏁 Data distribution finished. [PersonDetails] +${personInserts}/~${personUpdates} [TripCrew] +${tripInserts}/~${tripUpdates}`,
    );
    return { personInserts, personUpdates, tripInserts, tripUpdates };
  } catch (error: any) {
    console.error("❌ Multi-table engine processing fault:", error);
    throw error;
  }
}
