import { and, asc, desc, eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import { db } from "./db";
import {
  crewMembers,
  dataLoad,
  duties,
  groundDuties,
  personDetails,
  roster,
  rosterAmendments,
  rosterHistory,
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

/** Sortable feed stamp from BA roster header DateOfCreation + TimeOfCreation. */
function getFeedTimestampKey(dateStr: string, timeStr: string): string {
  const date = dateStr?.trim() || "0000-00-00";
  const parts = (timeStr || "00:00").trim().split(":");
  const hours = (parts[0] || "0").padStart(2, "0");
  const minutes = (parts[1] || "0").padStart(2, "0");
  return `${date}T${hours}:${minutes}`;
}

function formatFeedStamp(dateStr: string, timeStr: string): string {
  const key = getFeedTimestampKey(dateStr, timeStr);
  const [date, time] = key.split("T");
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${time}`;
}

async function findLatestFeedLoadForMonth(rosterMonth: string) {
  const monthLoads = await db
    .select()
    .from(dataLoad)
    .where(eq(dataLoad.rosterMonthNumber, rosterMonth));

  let latestKey = "";
  let latestLoad: (typeof monthLoads)[number] | null = null;

  for (const load of monthLoads) {
    const key = getFeedTimestampKey(
      load.rosterDateOfCreation || "",
      load.rosterTimeOfCreation || "",
    );
    if (key > latestKey) {
      latestKey = key;
      latestLoad = load;
    }
  }

  return { latestKey, latestLoad };
}

export async function loadRosterXmlData(fullRawContent: string) {
  try {
    console.log("🚀 Initializing Relational Ingestion Engine...");
    const timestampString = new Date().toISOString();

    let totalTripsParsed = 0;
    let totalGroundDutiesParsed = 0;

    let newTripsCount = 0;
    let removedTripsCount = 0;
    let updatedTripsCount = 0;

    let newGroundCount = 0;
    let removedGroundCount = 0;

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
    const incomingFeedKey = getFeedTimestampKey(
      incomingRosterDate,
      incomingRosterTime,
    );

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
      return {
        success: true,
        isDuplicateBypass: true,
        message:
          `Data previously loaded: ${formatFriendlyDateTime(matchRecord.createdAt)}\n` +
          `No changes were made to the database.\n\n` +
          `Feed Details:\n` +
          `• ${incomingRosterName}\n` +
          `• ${incomingTripName}\n` +
          `• Created: ${formatFeedStamp(incomingRosterDate, incomingRosterTime)}`,
      };
    }

    const { latestKey: latestMonthFeedKey, latestLoad: latestMonthLoad } =
      await findLatestFeedLoadForMonth(rosterMonth);

    if (latestMonthLoad && incomingFeedKey < latestMonthFeedKey) {
      return {
        success: true,
        isOlderFeedRejected: true,
        message:
          `Data previously loaded: ${formatFriendlyDateTime(latestMonthLoad.createdAt)}\n` +
          `No changes were made to the database.\n\n` +
          `Feed Details:\n` +
          `• This feed is older than the latest ${rosterMonth} roster in the app\n` +
          `• Incoming created: ${formatFeedStamp(incomingRosterDate, incomingRosterTime)}\n` +
          `• Latest created: ${formatFeedStamp(
            latestMonthLoad.rosterDateOfCreation || "",
            latestMonthLoad.rosterTimeOfCreation || "",
          )}\n` +
          `• ${latestMonthLoad.rosterFileName}\n` +
          `• Other months can still be loaded without affecting ${rosterMonth}`,
      };
    }

    if (latestMonthLoad && incomingFeedKey === latestMonthFeedKey) {
      return {
        success: true,
        isDuplicateBypass: true,
        message:
          `Data previously loaded: ${formatFriendlyDateTime(latestMonthLoad.createdAt)}\n` +
          `No changes were made to the database.\n\n` +
          `Feed Details:\n` +
          `• ${latestMonthLoad.rosterFileName}\n` +
          `• Created: ${formatFeedStamp(incomingRosterDate, incomingRosterTime)}`,
      };
    }

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
      })
      .returning({ id: dataLoad.id });

    const currentDataLoadId = dataLoadInserted[0].id;

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
        .orderBy(desc(personDetails.updatedAt))
        .limit(1);

      if (match.length > 0 && isPersonDetailsIdentical(match[0], pData)) {
        // Latest snapshot unchanged — do not insert a duplicate history row.
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
          const startTime = gd.StartTime?.toString() || "";
          const endDate = gd.EndDate?.toString() || "";
          const endTime = gd.EndTime?.toString() || "";
          const creditAmount = rd.DutyCredit?.Amount?.toString() || "";

          const existingGD = await db
            .select()
            .from(groundDuties)
            .where(
              and(
                eq(groundDuties.crewMovementCode, crewMovementCode),
                eq(groundDuties.startDate, startDate),
                eq(groundDuties.startTime, startTime),
                eq(groundDuties.endDate, endDate),
                eq(groundDuties.endTime, endTime),
                eq(groundDuties.creditAmount, creditAmount),
              ),
            )
            .limit(1);

          let targetGroundDutyId: number;

          if (existingGD.length > 0) {
            targetGroundDutyId = existingGD[0].id;
            await db
              .update(groundDuties)
              .set({ updatedAt: timestampString })
              .where(eq(groundDuties.id, targetGroundDutyId));
          } else {
            const insertedGD = await db
              .insert(groundDuties)
              .values({
                crewMovementCode,
                startDate,
                startTime,
                endDate,
                endTime,
                creditAmount,
                createdAt: timestampString,
                updatedAt: timestampString,
              })
              .returning({ id: groundDuties.id });

            targetGroundDutyId = insertedGD[0].id;
          }

          totalGroundDutiesParsed++;

          await db.insert(roster).values({
            dataLoadId: currentDataLoadId,
            type: "G",
            groundDutyId: targetGroundDutyId,
            rosterMonth: rosterMonth,
            startDate: startDate,
            createdAt: timestampString,
            updatedAt: timestampString,
          });

          await db.insert(rosterHistory).values({
            dataLoadId: currentDataLoadId,
            type: "G",
            groundDutyId: targetGroundDutyId,
            rosterMonth: rosterMonth,
            startDate: startDate,
            createdAt: timestampString,
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
      totalTripsParsed = formattedTrips.length;

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

        await db.insert(rosterHistory).values({
          dataLoadId: currentDataLoadId,
          type: "T",
          tripNumber: currentTripNum,
          rosterMonth: rosterMonth,
          startDate: tripStartDateStr,
          createdAt: timestampString,
        });

        // Parse Crew Members
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

        // Parse Duties
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

            // Parse Sectors
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

    // ── STEP 2.5: DELTA LOG COMPILER (Using exact positional coordinate matching)
    const previousLoads = await db
      .select({ id: dataLoad.id })
      .from(dataLoad)
      .where(eq(dataLoad.rosterMonthNumber, rosterMonth))
      .orderBy(asc(dataLoad.id));

    if (previousLoads.length > 1) {
      const lastLoadId = previousLoads[previousLoads.length - 2].id;

      const historicalRoster = await db
        .select()
        .from(rosterHistory)
        .where(eq(rosterHistory.dataLoadId, lastLoadId));

      const currentRoster = await db
        .select()
        .from(roster)
        .where(eq(roster.dataLoadId, currentDataLoadId));

      // A. EVALUATE CREATIONS ('C')
      for (const curr of currentRoster) {
        const foundInHistory = historicalRoster.some(
          (hist) =>
            hist.type === curr.type &&
            (curr.type === "T"
              ? hist.tripNumber === curr.tripNumber
              : hist.groundDutyId === curr.groundDutyId),
        );

        if (!foundInHistory) {
          if (curr.type === "T") newTripsCount++;
          else newGroundCount++;

          await db.insert(rosterAmendments).values({
            dataLoadId: currentDataLoadId,
            rosterMonth,
            changeType: "C",
            itemType: curr.type,
            identifier:
              curr.type === "T"
                ? curr.tripNumber || ""
                : String(curr.groundDutyId),
            tripNumber: curr.type === "T" ? curr.tripNumber : null,
            groundDutyId: curr.type === "G" ? curr.groundDutyId : null,
            details:
              curr.type === "T"
                ? `New Trip: ${curr.tripNumber}`
                : `New Ground Duty: ${curr.startDate}`,
            createdAt: timestampString,
          });
        }
      }

      // B. EVALUATE DELETIONS ('D')
      for (const hist of historicalRoster) {
        const foundInCurrent = currentRoster.some(
          (curr) =>
            curr.type === hist.type &&
            (hist.type === "T"
              ? curr.tripNumber === hist.tripNumber
              : curr.groundDutyId === hist.groundDutyId),
        );

        if (!foundInCurrent) {
          if (hist.type === "T") removedTripsCount++;
          else removedGroundCount++;

          await db.insert(rosterAmendments).values({
            dataLoadId: currentDataLoadId,
            rosterMonth,
            changeType: "D",
            itemType: hist.type,
            identifier:
              hist.type === "T"
                ? hist.tripNumber || ""
                : String(hist.groundDutyId),
            tripNumber: hist.type === "T" ? hist.tripNumber : null,
            groundDutyId: hist.type === "G" ? hist.groundDutyId : null,
            details:
              hist.type === "T"
                ? `Trip Removed: ${hist.tripNumber}`
                : `Ground Duty Removed: ${hist.groundDutyId}`,
            createdAt: timestampString,
          });
        }
      }

      // C. EXACT CORE DATA STRING VERIFICATION (Breaks the updatedAt processing trap)
      for (const curr of currentRoster) {
        if (curr.type !== "T" || !curr.tripNumber) continue;

        const originalHistoryRow = historicalRoster.find(
          (hist) => hist.type === "T" && hist.tripNumber === curr.tripNumber,
        );
        if (!originalHistoryRow) continue;

        const tripNum = curr.tripNumber;

        const freshSectors = await db
          .select()
          .from(sectors)
          .where(eq(sectors.tripNumber, tripNum));

        for (const fSec of freshSectors) {
          const historicalMatch = await db
            .select()
            .from(sectors)
            .where(
              and(
                eq(sectors.tripNumber, tripNum),
                eq(sectors.dutyNumber, fSec.dutyNumber),
                eq(sectors.sectorNumber, fSec.sectorNumber),
                eq(sectors.createdAt, originalHistoryRow.createdAt),
              ),
            )
            .limit(1);

          if (historicalMatch.length > 0) {
            const hSec = historicalMatch[0];

            if (
              fSec.flightNumber !== hSec.flightNumber ||
              fSec.departureStation !== hSec.departureStation ||
              fSec.arrivalStation !== hSec.arrivalStation ||
              fSec.departureTime !== hSec.departureTime ||
              fSec.arrivalTime !== hSec.arrivalTime
            ) {
              updatedTripsCount++;
              await db.insert(rosterAmendments).values({
                dataLoadId: currentDataLoadId,
                rosterMonth,
                changeType: "U",
                itemType: "T",
                identifier: tripNum,
                tripNumber: tripNum,
                groundDutyId: null, // It's a trip, so this is null
                dutyNumber: fSec.dutyNumber,
                sectorNumber: fSec.sectorNumber,
                details: `Trip ${tripNum}, Duty ${fSec.dutyNumber}: Flight ${fSec.carrier}${fSec.flightNumber} timings or routing updated.`,
                createdAt: timestampString,
              });
            }
          } else {
            updatedTripsCount++;
            await db.insert(rosterAmendments).values({
              dataLoadId: currentDataLoadId,
              rosterMonth,
              changeType: "C",
              itemType: "T",
              identifier: tripNum,
              tripNumber: tripNum,
              dutyNumber: fSec.dutyNumber,
              sectorNumber: fSec.sectorNumber,
              details: `Trip ${tripNum}, Duty ${fSec.dutyNumber}: New flight leg ${fSec.carrier}${fSec.flightNumber} added to duty.`,
              createdAt: timestampString,
            });
          }
        }

        const historicalSectors = await db
          .select()
          .from(sectors)
          .where(
            and(
              eq(sectors.tripNumber, tripNum),
              eq(sectors.createdAt, originalHistoryRow.createdAt),
            ),
          );

        for (const hSec of historicalSectors) {
          const stillExists = freshSectors.some(
            (fSec) =>
              fSec.dutyNumber === hSec.dutyNumber &&
              fSec.sectorNumber === hSec.sectorNumber,
          );

          if (!stillExists) {
            updatedTripsCount++;
            await db.insert(rosterAmendments).values({
              dataLoadId: currentDataLoadId,
              rosterMonth,
              changeType: "D",
              itemType: "T",
              identifier: tripNum,
              tripNumber: tripNum,
              dutyNumber: hSec.dutyNumber,
              sectorNumber: hSec.sectorNumber,
              details: `Trip ${tripNum}, Duty ${hSec.dutyNumber}: Flight leg ${hSec.carrier}${hSec.flightNumber} removed from duty.`,
              createdAt: timestampString,
            });
          }
        }
      }
    }

    console.log(`🏁 Data Load successful (#${currentDataLoadId})`);

    const tripsAmended = updatedTripsCount + removedTripsCount;
    const groundAmended = removedGroundCount;

    return {
      success: true,
      isDuplicateBypass: false,
      dataLoadId: currentDataLoadId,
      stats: {
        rosterMonth,
        tripsTotal: totalTripsParsed,
        groundTotal: totalGroundDutiesParsed,
        isFirstLoadForMonth: previousLoads.length <= 1,
        tripsNew: newTripsCount,
        tripsAmended,
        groundNew: newGroundCount,
        groundAmended,
        rosterFileName: incomingRosterName,
        tripFileName: incomingTripName,
        feedCreated: formatFeedStamp(incomingRosterDate, incomingRosterTime),
        deltas: {
          newTrips: newTripsCount,
          removedTrips: removedTripsCount,
          updatedTrips: updatedTripsCount,
          newGround: newGroundCount,
          removedGround: removedGroundCount,
        },
      },
    };
  } catch (error: any) {
    console.error("❌ Data Ingestion Failure:", error);
    throw error;
  }
}
