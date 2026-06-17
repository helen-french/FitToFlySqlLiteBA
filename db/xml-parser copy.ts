import { and, eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import { db } from "./db";
import {
  crewMembers,
  dataLoad,
  duties,
  groundDuties,
  personDetails,
  roster,
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

// Custom function to nicely format date strings from database timestamps for the UI alert box
function formatFriendlyDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export async function loadRosterXmlData(fullRawContent: string) {
  try {
    console.log("🚀 Initializing Relational Ingestion Engine...");
    const timestampString = new Date().toISOString();

    // ──✅ STEP 0: DECLARE SCOPE COUNTERS TO PREVENT TS COMPILER ERRORS AT THE RETURN BLOCK
    let totalTripInserts = 0;
    let totalGroundDutyInserts = 0;

    const rosterParts = fullRawContent.split("[TRIP]");
    const rosterPartClean = rosterParts[0].replace("[ROSTER]", "").trim();
    const tripPartClean = rosterParts.length > 1 ? rosterParts[1].trim() : "";

    const rosterJson = parser.parse(rosterPartClean);
    const tripJson = tripPartClean ? parser.parse(tripPartClean) : null;

    const rosterSpec = rosterJson["rfs:RosterFileSpecification"];
    const tripSpec = tripJson
      ? tripJson["tfs:TripFileSpecification"] ||
        tripJson["TripFileSpecification"]
      : null;

    if (!rosterSpec || !tripSpec) {
      throw new Error(
        "Invalid payload: Missing [ROSTER] or [TRIP] block specifications.",
      );
    }

    const rosterMonth =
      rosterSpec.RosterPeriod?.MonthNumber?.toString() || "2026-07";
    const rosterHeader = rosterSpec.RosterFileHeader;
    const tripHeader = tripSpec.TripFileHeader;

    const incomingRosterName = rosterHeader?.FileName?.toString() || "";
    const incomingRosterDate = rosterHeader?.DateOfCreation?.toString() || "";
    const incomingRosterTime = rosterHeader?.TimeOfCreation?.toString() || "";

    const incomingTripName = tripHeader?.FileName?.toString() || "";
    const incomingTripDate = tripHeader?.DateOfCreation?.toString() || "";
    const incomingTripTime = tripHeader?.TimeOfCreation?.toString() || "";

    // ──✅ STEP 1: BULLETPROOF PRE-FLIGHT CHECK FOR IDENTICAL DATA IMPORT HISTORY
    const duplicateCheck = await db
      .select()
      .from(dataLoad)
      .where(
        and(
          eq(dataLoad.rosterFileName, incomingRosterName),
          eq(dataLoad.rosterDateOfCreation, incomingRosterDate),
          eq(dataLoad.rosterTimeOfCreation, incomingRosterTime),
          eq(dataLoad.tripFileName, incomingTripName),
          eq(dataLoad.tripDateOfCreation, incomingTripDate),
          eq(dataLoad.tripTimeOfCreation, incomingTripTime),
        ),
      )
      .limit(1);

    if (duplicateCheck.length > 0) {
      const matchRecord = duplicateCheck[0];

      // Update the updatedAt field on the matching manifest record as requested
      await db
        .update(dataLoad)
        .set({ updatedAt: timestampString })
        .where(eq(dataLoad.id, matchRecord.id));

      console.log(
        "🛑 Duplicate file signature identified. Halting process transaction safely.",
      );

      // Return a targeted bypass manifest payload so the UI view controller knows exactly what to print out
      return {
        success: true,
        isDuplicateBypass: true,
        message: `⚠️ NO UPDATE\npreviously loaded ${formatFriendlyDateTime(matchRecord.createdAt)}.\n• ${incomingRosterName}\n• ${incomingTripName}`,
      };
    }

    // ──✅ STEP 2: FRESH NEW FILE LOAD CONFIRMED — GENERATE MASTER TRANSACTION MANIFEST RECORD
    const dataLoadInserted = await db
      .insert(dataLoad)
      .values({
        rosterFileName: incomingRosterName,
        rosterDateOfCreation: incomingRosterDate,
        rosterTimeOfCreation: incomingRosterTime,
        rosterMonthNumber: rosterMonth,
        rosterStartDateOfFeed:
          rosterSpec.RosterPeriod?.StartDateOfFeedPeriod?.toString() || "",
        rosterEndDateOfFeed:
          rosterSpec.RosterPeriod?.EndDateOfFeedPeriod?.toString() || "",

        tripFileName: incomingTripName,
        tripDateOfCreation: incomingTripDate,
        tripTimeOfCreation: incomingTripTime,

        createdAt: timestampString,
        updatedAt: timestampString,
      })
      .returning({ id: dataLoad.id });

    const currentDataLoadId = dataLoadInserted[0].id;

    // Flush old mapping markers *only* when an actual updated data payload manifest takes place
    await db.delete(roster).where(eq(roster.rosterMonth, rosterMonth));

    // Parse Personal Details
    const personalDetails =
      rosterSpec.RosterBlock?.RosterDetail?.PersonalDetails;
    if (personalDetails) {
      const pData = {
        staffNumber: personalDetails.StaffNumber?.toString() || "",
        surname: personalDetails.Surname?.toString() || "",
        initials: personalDetails.InitialsOfCrew?.toString() || "",
        nameCode: personalDetails.NameCode || "",
        seniorityNumber: personalDetails.SeniorityNumber
          ? parseInt(personalDetails.SeniorityNumber, 10)
          : null,
        individualCap: personalDetails.IndividualCAP?.toString() || "",
      };

      const match = await db
        .select()
        .from(personDetails)
        .where(eq(personDetails.staffNumber, pData.staffNumber))
        .limit(1);
      if (match.length > 0 && isPersonDetailsIdentical(match[0], pData)) {
        await db
          .update(personDetails)
          .set({ updatedAt: timestampString })
          .where(eq(personDetails.id, match[0].id));
      } else {
        await db.insert(personDetails).values({
          ...pData,
          createdAt: timestampString,
          updatedAt: timestampString,
        });
      }
    }

    // Parse Ground Duties
    const rosterDutiesArray = rosterSpec.RosterBlock?.RosterDetail?.RosterDuty;
    if (rosterDutiesArray) {
      const formattedRosterDuties = Array.isArray(rosterDutiesArray)
        ? rosterDutiesArray
        : [rosterDutiesArray];

      for (const rd of formattedRosterDuties) {
        if (rd.GroundDuty) {
          const gd = rd.GroundDuty;
          const crewMovementCode = gd.CrewMovementCode?.toString() || "";
          const startDate = gd.StartDate?.toString() || "";
          const creditAmount = rd.DutyCredit?.Amount?.toString() || "";

          const insertedGD = await db
            .insert(groundDuties)
            .values({
              crewMovementCode,
              startDate,
              startTime: gd.StartTime?.toString() || "",
              endDate: gd.EndDate?.toString() || "",
              endTime: gd.EndTime?.toString() || "",
              creditAmount,
              createdAt: timestampString,
              updatedAt: timestampString,
            })
            .returning({ id: groundDuties.id });

          // ──✅ INCREMENT GROUND DUTY COUNTER
          totalGroundDutyInserts++;

          await db.insert(roster).values({
            dataLoadId: currentDataLoadId,
            type: "G",
            groundDutyId: insertedGD[0].id,
            rosterMonth: rosterMonth,
            startDate: startDate,
            createdAt: timestampString,
            updatedAt: timestampString,
          });
        }
      }
    }

    // Parse Trips
    const tripBlock = tripSpec.TripBlock;
    const tripsArray = tripBlock?.Trip;

    if (tripsArray) {
      const formattedTrips = Array.isArray(tripsArray)
        ? tripsArray
        : [tripsArray];

      // ──✅ CAPTURE SCOPE-SAFE LENGTH COUNTER
      totalTripInserts = formattedTrips.length;

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

        let matchedCategory = "";
        let matchedCreditAmount = "";

        const tripCreditNode = currentTrip?.TripCredit?.TripCreditAmount;
        if (tripCreditNode) {
          const creditArray = Array.isArray(tripCreditNode)
            ? tripCreditNode
            : [tripCreditNode];
          const targetCredit = creditArray[0];
          if (targetCredit) {
            matchedCategory = targetCredit.CreditCategory?.toString() || "";
            matchedCreditAmount = targetCredit.CreditAmount?.toString() || "";
          }
        }

        const tPayload = {
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
          creditCategory: matchedCategory,
          creditAmount: matchedCreditAmount,
        };

        const match = await db
          .select()
          .from(trips)
          .where(eq(trips.tripNumber, currentTripNum))
          .limit(1);
        if (match.length > 0) {
          await db
            .update(trips)
            .set({ ...tPayload, updatedAt: timestampString })
            .where(eq(trips.tripNumber, currentTripNum));
        } else {
          await db.insert(trips).values({
            ...tPayload,
            createdAt: timestampString,
            updatedAt: timestampString,
          });
        }

        await db.insert(roster).values({
          dataLoadId: currentDataLoadId,
          type: "T",
          tripNumber: currentTripNum,
          rosterMonth: rosterMonth,
          startDate: tripStartDateStr,
          createdAt: timestampString,
          updatedAt: timestampString,
        });

        const crewMembersElements = currentTrip?.TripCrewMember;
        if (crewMembersElements) {
          const formattedMembers = Array.isArray(crewMembersElements)
            ? crewMembersElements
            : [crewMembersElements];
          for (const member of formattedMembers) {
            const memberStaffNum = member.StaffNumber?.toString() || "";
            if (!memberStaffNum) continue;

            const cPayload = {
              staffNumber: memberStaffNum,
              surname: member.Surname?.toString() || "",
              initials: member.Initials?.toString() || "",
              nameCode: member.PilotNameCode?.toString() || "",
              crewFunction: member.CrewFunction
                ? parseInt(member.CrewFunction, 10)
                : null,
              aircraftType,
              crewBase,
              rosterMonth: rosterMonth,
            };

            const cMatch = await db
              .select()
              .from(crewMembers)
              .where(eq(crewMembers.staffNumber, memberStaffNum))
              .limit(1);
            if (cMatch.length > 0) {
              if (!isCrewMemberIdentical(cMatch[0], cPayload)) {
                await db
                  .update(crewMembers)
                  .set({ ...cPayload, updatedAt: timestampString })
                  .where(eq(crewMembers.staffNumber, memberStaffNum));
              }
            } else {
              await db.insert(crewMembers).values({
                ...cPayload,
                createdAt: timestampString,
                updatedAt: timestampString,
              });
            }

            await db
              .delete(tripCrew)
              .where(
                and(
                  eq(tripCrew.tripNumber, currentTripNum),
                  eq(tripCrew.staffNumber, memberStaffNum),
                ),
              );
            await db.insert(tripCrew).values({
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
            const dPayload = {
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
            };

            const dMatch = await db
              .select()
              .from(duties)
              .where(
                and(
                  eq(duties.tripNumber, currentTripNum),
                  eq(duties.dutyNumber, currentDutyNum),
                ),
              )
              .limit(1);
            if (dMatch.length > 0) {
              await db
                .update(duties)
                .set({ ...dPayload, updatedAt: timestampString })
                .where(
                  and(
                    eq(duties.tripNumber, currentTripNum),
                    eq(duties.dutyNumber, currentDutyNum),
                  ),
                );
            } else {
              await db.insert(duties).values({
                ...dPayload,
                createdAt: timestampString,
                updatedAt: timestampString,
              });
            }

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

                const sPayload = {
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
                };

                const sMatch = await db
                  .select()
                  .from(sectors)
                  .where(
                    and(
                      eq(sectors.tripNumber, currentTripNum),
                      eq(sectors.dutyNumber, currentDutyNum),
                      eq(sectors.sectorNumber, sPayload.sectorNumber),
                    ),
                  )
                  .limit(1);
                if (sMatch.length > 0) {
                  await db
                    .update(sectors)
                    .set({ ...sPayload, updatedAt: timestampString })
                    .where(
                      and(
                        eq(sectors.tripNumber, currentTripNum),
                        eq(sectors.dutyNumber, currentDutyNum),
                        eq(sectors.sectorNumber, sPayload.sectorNumber),
                      ),
                    );
                } else {
                  await db.insert(sectors).values({
                    ...sPayload,
                    createdAt: timestampString,
                    updatedAt: timestampString,
                  });
                }
              }
            }
          }
        }
      }
    }

    console.log(`🏁 Data Load successful (#${currentDataLoadId})`);

    // ──✅ STEP 3: HAND BACK REAL, VALUE-BOUND VARIABLES INSTEAD OF UNBOUND TOKENS
    return {
      success: true,
      isDuplicateBypass: false,
      dataLoadId: currentDataLoadId,
      stats: {
        personInserts: 1,
        personUpdates: 0,
        tripInserts: totalTripInserts, // Maps exactly to parsed trips count
        tripUpdates: totalGroundDutyInserts, // Maps ground items dynamically to your hook window
      },
    };
  } catch (error: any) {
    console.error("❌ Data Ingestion Failure:", error);
    throw error;
  }
}
