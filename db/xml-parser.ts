import { and, desc, eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import { db } from "./db";
import { personDetails, tripCrew } from "./schema";

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
    (existing.seniorityNumber !== null
      ? Number(existing.seniorityNumber)
      : null) ===
      (incoming.seniorityNumber !== null && incoming.seniorityNumber !== ""
        ? Number(incoming.seniorityNumber)
        : null) &&
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
    (existing.crewFunction !== null ? Number(existing.crewFunction) : null) ===
      (incoming.crewFunction !== null && incoming.crewFunction !== ""
        ? Number(incoming.crewFunction)
        : null) &&
    String(existing.aircraftType || "").trim() ===
      String(incoming.aircraftType || "").trim() &&
    String(existing.crewBase || "").trim() ===
      String(incoming.crewBase || "").trim()
  );
}

export async function loadRosterXmlData(fullRawContent: string) {
  try {
    console.log("🚀 Starting History Version-Control XML Ingestion Core...");
    const jsonObj = parser.parse(fullRawContent);

    let rosterMonth = "2026-05";
    let personInserts = 0,
      personUpdates = 0;
    let tripInserts = 0,
      tripUpdates = 0;

    const incomingPeople: any[] = [];
    const incomingTrips: any[] = [];
    const timestampString = new Date().toISOString();

    const rosterSpecification = jsonObj["rfs:RosterFileSpecification"];
    if (rosterSpecification) {
      rosterMonth =
        rosterSpecification.RosterPeriod?.MonthNumber?.toString() ||
        rosterMonth;
      const rosterBlock = rosterSpecification.RosterBlock;
      const personalDetails = rosterBlock?.RosterDetail?.PersonalDetails;
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

    const tripSpecification =
      jsonObj["tfs:TripFileSpecification"] || jsonObj["TripFileSpecification"];
    const tripsArray = tripSpecification?.TripBlock?.Trip;

    if (tripsArray) {
      const formattedTrips = Array.isArray(tripsArray)
        ? tripsArray
        : [tripsArray];
      const fallbackAircraft =
        tripSpecification?.TripBlock?.TripBlockHeader?.AircraftType?.toString() ||
        "777";
      const fallbackBase =
        tripSpecification?.TripBlock?.TripBlockHeader?.CrewBase?.toString() ||
        "LHR";

      for (const currentTrip of formattedTrips) {
        const crewMembers = currentTrip?.TripCrewMember;
        if (!crewMembers) continue;

        const formattedMembers = Array.isArray(crewMembers)
          ? crewMembers
          : [crewMembers];
        for (const member of formattedMembers) {
          const colleagueStaffNum = member.StaffNumber?.toString() || "";
          if (!colleagueStaffNum) continue;

          const existsInBatch = incomingTrips.some(
            (t) => t.staffNumber === colleagueStaffNum,
          );
          if (existsInBatch) continue;

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
            createdAt: timestampString,
            updatedAt: timestampString,
          });
        }
      }
    }

    // PROCESSING A: PERSON DETAILS HISTORY LOG
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
          // NO CHANGES: Just bump updatedAt on the latest matched node
          await db
            .update(personDetails)
            .set({ updatedAt: timestampString })
            .where(eq(personDetails.id, latestPerson.id))
            .execute();
          personUpdates++;
        } else {
          // CHANGES DETECTED: Insert a brand new separate history record node entry
          await db.insert(personDetails).values(incomingPerson).execute();
          console.log(
            `⚡ Profile Alteration Logged! Appended new file version node for: ${incomingPerson.surname}`,
          );
          personInserts++;
        }
      } else {
        // Core Entry initialization node
        await db.insert(personDetails).values(incomingPerson).execute();
        personInserts++;
      }
    }

    // PROCESSING B: TRIP CREW HISTORY LOG (Unique combination key checkpoints)
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
          // NO CHANGES: Just bump updatedAt on the latest matched monthly node
          await db
            .update(tripCrew)
            .set({ updatedAt: timestampString })
            .where(eq(tripCrew.id, latestTrip.id))
            .execute();
          tripUpdates++;
        } else {
          // CHANGES DETECTED: Insert a brand new separate monthly operational history version row
          await db.insert(tripCrew).values(incomingTrip).execute();
          console.log(
            `⚡ Roster Alteration Logged! Appended new month file version entry for: ${incomingTrip.surname}`,
          );
          tripInserts++;
        }
      } else {
        // Monthly initialization node
        await db.insert(tripCrew).values(incomingTrip).execute();
        tripInserts++;
      }
    }

    console.log(
      `🏁 Log Update Finished. [PersonDetails] +${personInserts}/~${personUpdates} [TripCrew] +${tripInserts}/~${tripUpdates}`,
    );
    return { personInserts, personUpdates, tripInserts, tripUpdates };
  } catch (error: any) {
    console.error("❌ History versioning engine fault:", error);
    throw error;
  }
}
