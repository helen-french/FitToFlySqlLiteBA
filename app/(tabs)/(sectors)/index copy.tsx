import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeInLeft,
  FadeInRight,
  LinearTransition,
} from "react-native-reanimated";

import Colors from "@/constants/Colors";
import { db } from "@/db/db";
import {
  airports,
  crewMembers,
  duties,
  sectors,
  tripCrew,
  trips,
} from "@/db/schema";
import { and, asc, desc, eq, gt, gte, inArray, lt, lte } from "drizzle-orm";

interface SectorRowData {
  id: number;
  carrier: string;
  flightNumber: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  departureTimeLocal: string | null;
  arrivalTime: string;
  arrivalTimeLocal: string | null;
  actualReportTime: string | null;
  flyingHours: string | null;
  departureNameClean?: string;
  arrivalNameClean?: string;
}

interface SectorItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  data?: SectorRowData;
}

interface UniqueStationItem {
  code: string;
  fullNameClean: string;
}

interface ActiveTripMeta {
  tripNumber: string;
  startDate: string;
  endDate: string;
  routingSummary: string;
  totalDays: number;
  creditAmount: string | null;
  uniqueStationsList: UniqueStationItem[];
  outfieldHotelsList: UniqueStationItem[];
}

export default function SectorsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const params = useLocalSearchParams<{
    tripNumber?: string;
    startDate?: string;
    endDate?: string;
    routing?: string;
  }>();

  // --- Dynamic States ---
  const [currentTripNumber, setCurrentTripNumber] = useState<string | null>(
    null,
  );
  const [activeTrip, setActiveTrip] = useState<ActiveTripMeta | null>(null);
  const [itineraryTimeline, setItineraryTimeline] = useState<
    SectorItineraryItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [crewLoading, setCrewLoading] = useState(false);

  // Sequence Pointer Tracking States
  const [prevTripNumber, setPrevTripNumber] = useState<string | null>(null);
  const [nextTripNumber, setNextTripNumber] = useState<string | null>(null);
  const [animationDirection, setAnimationDirection] = useState<
    "left" | "right"
  >("right");

  const todayAnchorStr = "2026-06-16";

  const formatCardHeaderDate = useCallback((dateStr: string) => {
    if (!dateStr || !dateStr.includes("-")) return dateStr;
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }, []);

  const formatTimeDurationString = (rawDuration: string | null) => {
    if (!rawDuration) return null;
    const clean = rawDuration.replace("PT", "");
    if (!clean || clean === "0M") return null;
    const parts = clean.split("H");
    const hours = parseInt(parts[0], 10) || 0;
    const minutes =
      parts.length > 1 ? parseInt(parts[1].replace("M", ""), 10) || 0 : 0;
    return `${hours}hrs ${minutes}mins`;
  };

  const computeRoutingSummary = (sectorRows: any[]) => {
    if (sectorRows.length === 0) return "";
    const stations = [sectorRows[0].departureStation];
    sectorRows.forEach((s) => {
      if (stations[stations.length - 1] !== s.arrivalStation) {
        stations.push(s.arrivalStation);
      }
    });
    return stations.join(" → ");
  };

  const handleViewTripCrew = async () => {
    if (!activeTrip?.tripNumber) return;
    try {
      setCrewLoading(true);
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

      if (assignedRosterCrew.length === 0) {
        Alert.alert(
          "✈️ Roster Crew",
          `No operating crew records found logged for Trip (${activeTrip.tripNumber}).`,
        );
        return;
      }

      const formattedCrewStrings = assignedRosterCrew.map((c) => {
        const rolePrefix =
          c.crewFunction === 11
            ? "Capt"
            : c.crewFunction === 12
              ? "FO"
              : "Crew";
        return `${rolePrefix} ${c.initials} ${c.surname}`;
      });

      Alert.alert(
        `✈️ Roster Crew (${activeTrip.tripNumber})`,
        formattedCrewStrings.join("\n"),
      );
    } catch (err) {
      console.error(
        "Failed querying trip roster assigned crew manifests:",
        err,
      );
    } finally {
      setCrewLoading(false);
    }
  };

  useEffect(() => {
    if (params.tripNumber) {
      setCurrentTripNumber(params.tripNumber);
    }
  }, [params.tripNumber]);

  // --- Date-Sorted Sequential Navigation Engine ---
  const resolveAndLoadSectors = useCallback(async () => {
    setLoading(true);
    try {
      let targetTripNumber = currentTripNumber;
      let targetStartDate = params.startDate;
      let targetEndDate = params.endDate;
      let targetRouting = params.routing;

      if (!targetTripNumber) {
        let resolved = await db
          .select()
          .from(trips)
          .where(
            and(
              lte(trips.startDate, todayAnchorStr),
              gte(trips.endDate, todayAnchorStr),
            ),
          )
          .limit(1);

        if (resolved.length === 0) {
          resolved = await db
            .select()
            .from(trips)
            .where(gte(trips.startDate, todayAnchorStr))
            .orderBy(asc(trips.startDate))
            .limit(1);
        }

        if (resolved.length === 0) {
          resolved = await db
            .select()
            .from(trips)
            .where(lte(trips.endDate, todayAnchorStr))
            .orderBy(desc(trips.endDate))
            .limit(1);
        }

        if (resolved.length > 0) {
          targetTripNumber = resolved[0].tripNumber;
          setCurrentTripNumber(targetTripNumber);
        }
      }

      if (targetTripNumber) {
        const currentTripRow = await db
          .select()
          .from(trips)
          .where(eq(trips.tripNumber, targetTripNumber))
          .limit(1);

        if (currentTripRow.length === 0) return;
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

        const tripSectors = await db
          .select({
            id: sectors.id,
            carrier: sectors.carrier,
            flightNumber: sectors.flightNumber,
            departureStation: sectors.departureStation,
            arrivalStation: sectors.arrivalStation,
            departureTime: sectors.departureTime,
            departureTimeLocal: sectors.departureTimeLocal,
            arrivalTime: sectors.arrivalTime,
            arrivalTimeLocal: sectors.arrivalTimeLocal,
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
            const fullNameClean = rawName
              .replace(/airport|international/gi, "")
              .trim();
            return { code, fullNameClean };
          },
        );

        const outfieldCodes =
          rawStationSequence.length > 2
            ? Array.from(new Set(rawStationSequence.slice(1, -1)))
            : [];

        const outfieldHotelsList: UniqueStationItem[] = outfieldCodes.map(
          (code) => {
            const rawName = nameMap.get(code) || code;
            const fullNameClean = rawName
              .replace(/airport|international/gi, "")
              .trim();
            return { code, fullNameClean };
          },
        );

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

          const departureNameClean = rawDepName
            .replace(/airport|international/gi, "")
            .trim();
          const arrivalNameClean = rawArrName
            .replace(/airport|international/gi, "")
            .trim();

          timeline.push({
            type: "flight",
            dateStr: currentLocDate,
            data: {
              ...currentSector,
              departureNameClean,
              arrivalNameClean,
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

        let computedDays = 1;
        if (tripSectors.length > 0) {
          const firstSector = tripSectors[0];
          const lastSector = tripSectors[tripSectors.length - 1];

          targetStartDate = firstSector.departureTime.split("T")[0];
          let lastSectorDateStr = lastSector.departureTime.split("T")[0];

          if (lastSector.arrivalTime) {
            const departureTimePart =
              lastSector.departureTimeLocal ||
              lastSector.departureTime.split("T")[1];
            if (departureTimePart && departureTimePart.includes(":")) {
              const depHour = parseInt(departureTimePart.split(":")[0], 10);
              const arrHour = parseInt(
                lastSector.arrivalTime.split(":")[0],
                10,
              );

              if (!isNaN(depHour) && !isNaN(arrHour) && arrHour < depHour) {
                const baseDateObj = new Date(`${lastSectorDateStr}T12:00:00`);
                if (!isNaN(baseDateObj.getTime())) {
                  baseDateObj.setDate(baseDateObj.getDate() + 1);
                  lastSectorDateStr = baseDateObj.toISOString().split("T")[0];
                }
              }
            }
          }

          targetEndDate = lastSectorDateStr;

          const startD = new Date(`${targetStartDate}T12:00:00`);
          const endD = new Date(`${lastSectorDateStr}T12:00:00`);
          if (!isNaN(startD.getTime()) && !isNaN(endD.getTime())) {
            const timeDiff = Math.abs(endD.getTime() - startD.getTime());
            computedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
          }
        }

        targetRouting = computeRoutingSummary(tripSectors);

        setActiveTrip({
          tripNumber: targetTripNumber,
          startDate: targetStartDate,
          endDate: targetEndDate || targetStartDate,
          routingSummary: targetRouting,
          totalDays: computedDays,
          creditAmount: baselineTrip.creditAmount,
          uniqueStationsList,
          outfieldHotelsList,
        });

        setItineraryTimeline(timeline);
      } else {
        setActiveTrip(null);
        setItineraryTimeline([]);
      }
    } catch (err) {
      console.error("Failed executing sector navigation resolution:", err);
    } finally {
      setLoading(false);
    }
  }, [currentTripNumber]);

  useEffect(() => {
    resolveAndLoadSectors();
  }, [resolveAndLoadSectors]);

  const handleNavigateToTrip = (
    nextTargetId: string,
    direction: "left" | "right",
  ) => {
    setAnimationDirection(direction);
    setCurrentTripNumber(nextTargetId);
  };

  const themeColors = {
    textColor: isDark ? "#FFFFFF" : "#1A1A1A",
    subTextColor: isDark ? "#A0A0A0" : "#666666",
    accent: "#007AFF",
    border: isDark ? "rgba(56, 56, 58, 0.4)" : "rgba(229, 229, 234, 0.6)",
    nestedBoxBg: isDark ? "#2C2C2E" : "#FFFFFF",
    cardBg: isDark ? "#1C1C1E" : "#F2F2F7",
    timelinePipe: "#34C759",
    localTime: isDark ? Colors.dark.localTime : Colors.light.localTime,
    disabledBtn: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
  };

  return (
    <TabScreenLayout onRefresh={resolveAndLoadSectors}>
      {/* MAP BANNER FRAME */}
      <View
        style={[styles.mapContainer, { backgroundColor: themeColors.cardBg }]}
      >
        <Image
          source={require("@/assets/images/LGWToMCO.png")}
          style={styles.mapImage}
          resizeMode="cover"
        />
      </View>

      {loading && !activeTrip && (
        <ActivityIndicator
          size="small"
          color={themeColors.accent}
          style={{ marginVertical: 40 }}
        />
      )}

      {activeTrip && (
        <View style={styles.activeContentContainer}>
          {/* NAVIGATION AND HISTORY PANEL HEADER ROW */}
          <View style={styles.headerControlStripRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/(details)")}
              style={[
                styles.backButton,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.nestedBoxBg,
                },
              ]}
            >
              <FontAwesome6
                name="arrow-left"
                size={12}
                color={themeColors.accent}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontFamily: "GoogleSansBold",
                  fontSize: 13,
                  color: themeColors.textColor,
                }}
              >
                Trip
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "transparent",
              }}
            >
              {/* Crew Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={crewLoading}
                onPress={handleViewTripCrew}
                style={[
                  styles.utilityPillButton,
                  {
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.nestedBoxBg,
                  },
                ]}
              >
                {crewLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={themeColors.accent}
                    style={{ marginRight: 4 }}
                  />
                ) : (
                  <FontAwesome6
                    name="users"
                    size={11}
                    color={themeColors.accent}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text
                  style={[
                    styles.utilityPillText,
                    { color: themeColors.textColor },
                  ]}
                >
                  Crew
                </Text>
              </TouchableOpacity>

              {/* Hotel Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {}}
                style={[
                  styles.utilityPillButton,
                  {
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.nestedBoxBg,
                    marginRight: 12,
                  },
                ]}
              >
                <FontAwesome6
                  name="hotel"
                  size={11}
                  color={themeColors.accent}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.utilityPillText,
                    { color: themeColors.textColor },
                  ]}
                >
                  Hotel
                </Text>
              </TouchableOpacity>

              {/* Timeline Stepper Chevron Controls */}
              <View
                style={[
                  styles.stepperContainerRow,
                  {
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.nestedBoxBg,
                  },
                ]}
              >
                <TouchableOpacity
                  disabled={!prevTripNumber}
                  onPress={() => handleNavigateToTrip(prevTripNumber!, "left")}
                  style={[
                    styles.stepActionBtn,
                    !prevTripNumber && {
                      backgroundColor: themeColors.disabledBtn,
                    },
                    {
                      borderRightWidth: 1,
                      borderRightColor: themeColors.border,
                    },
                  ]}
                >
                  <FontAwesome6
                    name="chevron-left"
                    size={12}
                    color={prevTripNumber ? themeColors.accent : "#8E8E93"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!nextTripNumber}
                  onPress={() => handleNavigateToTrip(nextTripNumber!, "right")}
                  style={[
                    styles.stepActionBtn,
                    !nextTripNumber && {
                      backgroundColor: themeColors.disabledBtn,
                    },
                  ]}
                >
                  <FontAwesome6
                    name="chevron-right"
                    size={12}
                    color={nextTripNumber ? themeColors.accent : "#8E8E93"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* STABLE ANIMATED ENTRY PANEL */}
          <Animated.View
            key={activeTrip.tripNumber}
            entering={
              animationDirection === "right"
                ? FadeInRight.duration(150)
                : FadeInLeft.duration(150)
            }
            layout={LinearTransition.duration(150)}
            style={{ width: "100%", backgroundColor: "transparent" }}
          >
            {/* TRIP METADATA BLOCK CARD */}
            <View style={styles.tripMetaBlock}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "transparent",
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: "GoogleSansBold",
                    fontSize: 14,
                    color: themeColors.textColor,
                  }}
                >
                  {formatCardHeaderDate(activeTrip.startDate)} —{" "}
                  {formatCardHeaderDate(activeTrip.endDate)}
                </Text>
                <Text
                  style={{
                    fontFamily: "GoogleSansBold",
                    fontSize: 13,
                    color: themeColors.subTextColor,
                  }}
                >
                  {activeTrip.totalDays}{" "}
                  {activeTrip.totalDays === 1 ? "Day" : "Days"}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}
              >
                <FontAwesome6
                  name="plane-departure"
                  size={13}
                  color={themeColors.accent}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.routingSummaryText,
                    { color: themeColors.textColor },
                  ]}
                >
                  {activeTrip.routingSummary}
                </Text>
              </View>

              {/* Dynamic Trip Credit Slot */}
              {activeTrip.creditAmount && (
                <Text
                  style={{
                    fontFamily: "GoogleSans",
                    fontSize: 14,
                    color: themeColors.subTextColor,
                    marginTop: 4,
                    paddingLeft: 19,
                    fontWeight: "400",
                  }}
                >
                  {formatTimeDurationString(activeTrip.creditAmount)}
                </Text>
              )}
            </View>

            {/* CONTINUOUS TIMELINE PIPELINE */}
            {itineraryTimeline.length > 0 && (
              <View style={styles.timelinePipelineContainer}>
                <View
                  style={[
                    styles.verticalTimelinePipe,
                    { backgroundColor: themeColors.timelinePipe },
                  ]}
                />

                <View style={styles.rowsWrapperBlock}>
                  {itineraryTimeline.map((item, index) => (
                    <View key={index} style={styles.itineraryItemRow}>
                      <View
                        style={[
                          styles.pipeCircleNode,
                          {
                            borderColor: themeColors.timelinePipe,
                            backgroundColor: isDark ? "#1C1C1E" : "#ffffff",
                          },
                        ]}
                      >
                        <FontAwesome6
                          name={item.type === "flight" ? "plane" : "hotel"}
                          size={9}
                          color={themeColors.accent}
                          style={
                            item.type === "flight"
                              ? { transform: [{ rotate: "-45deg" }] }
                              : null
                          }
                        />
                      </View>

                      <View style={styles.elementDataBlock}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "transparent",
                            marginBottom: 3,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: "GoogleSansBold",
                              fontSize: 14,
                              color: themeColors.textColor,
                            }}
                          >
                            {formatCardHeaderDate(item.dateStr)}
                          </Text>
                          {item.type === "flight" &&
                            item.data?.actualReportTime && (
                              <Text
                                style={{
                                  fontFamily: "GoogleSans",
                                  fontSize: 14,
                                  color: themeColors.subTextColor,
                                  marginLeft: 8,
                                }}
                              >
                                | Report: {item.data.actualReportTime}
                              </Text>
                            )}
                        </View>

                        {item.type === "flight" && item.data ? (
                          <View style={{ backgroundColor: "transparent" }}>
                            <Text
                              style={{
                                fontFamily: "GoogleSansBold",
                                fontSize: 14,
                                color: themeColors.textColor,
                                marginBottom: 3,
                                lineHeight: 18,
                              }}
                            >
                              {item.data.departureNameClean} (
                              {item.data.departureStation}) to{" "}
                              {item.data.arrivalNameClean} (
                              {item.data.arrivalStation})
                            </Text>

                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: "transparent",
                              }}
                            >
                              <Text
                                style={{
                                  fontFamily: "GoogleSansBold",
                                  fontSize: 14,
                                  color: themeColors.accent,
                                  marginRight: 8,
                                }}
                              >
                                {item.data.carrier}
                                {item.data.flightNumber}
                              </Text>
                              <Text
                                style={{
                                  fontFamily: "GoogleSans",
                                  fontSize: 14,
                                  color: themeColors.subTextColor,
                                }}
                              >
                                {item.data.departureTimeLocal ||
                                  item.data.departureTime.split("T")[1]}{" "}
                                —{" "}
                                {item.data.arrivalTimeLocal ||
                                  item.data.arrivalTime}
                              </Text>
                            </View>

                            {item.data.flyingHours && (
                              <Text
                                style={{
                                  fontFamily: "GoogleSans",
                                  fontSize: 14,
                                  color: themeColors.subTextColor,
                                  marginTop: 3,
                                  fontWeight: "400",
                                }}
                              >
                                {formatTimeDurationString(
                                  item.data.flyingHours,
                                )}
                              </Text>
                            )}
                          </View>
                        ) : (
                          <Text
                            style={{
                              fontFamily: "GoogleSans",
                              fontSize: 14,
                              color: themeColors.subTextColor,
                              marginTop: 1,
                            }}
                          >
                            Layover / Rest Day
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* HOTEL DETAILS CONTAINER CARD */}
            {activeTrip.outfieldHotelsList &&
              activeTrip.outfieldHotelsList.length > 0 &&
              (() => {
                const singleTarget =
                  activeTrip.outfieldHotelsList.length === 1
                    ? activeTrip.outfieldHotelsList[0]
                    : null;

                return (
                  <View
                    style={[
                      styles.locationModuleCard,
                      {
                        borderColor: themeColors.border,
                        backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={singleTarget ? 0.6 : 1}
                      disabled={!singleTarget}
                      onPress={() => {
                        if (singleTarget) {
                          router.push({
                            pathname: "/(tabs)/(notes)",
                            params: { stationCode: singleTarget.code },
                          });
                        }
                      }}
                      style={[
                        styles.locationCardHeaderRow,
                        {
                          marginBottom: singleTarget ? 0 : 12,
                          justifyContent: "space-between",
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "transparent",
                        }}
                      >
                        <FontAwesome6
                          name="hotel"
                          size={13}
                          color={themeColors.accent}
                          style={{ marginRight: 8 }}
                        />
                        {/* ─── ✅ AMENDED: Stripped all dynamic airport code info extensions */}
                        <Text
                          style={[
                            styles.locationCardTitleText,
                            { color: themeColors.textColor },
                          ]}
                        >
                          Hotel Details
                        </Text>
                      </View>
                      {singleTarget && (
                        <FontAwesome6
                          name="chevron-right"
                          size={11}
                          color={themeColors.subTextColor}
                        />
                      )}
                    </TouchableOpacity>

                    {!singleTarget &&
                      activeTrip.outfieldHotelsList.map((station, sIdx) => (
                        <View
                          key={station.code}
                          style={{ backgroundColor: "transparent" }}
                        >
                          <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={() => {
                              router.push({
                                pathname: "/(tabs)/(notes)",
                                params: { stationCode: station.code },
                              });
                            }}
                            style={styles.stationInteractiveRow}
                          >
                            <Text
                              style={{
                                fontFamily: "GoogleSans",
                                fontSize: 14,
                                color: themeColors.textColor,
                                flex: 1,
                              }}
                            >
                              {station.fullNameClean}{" "}
                              <Text
                                style={{
                                  fontFamily: "GoogleSansBold",
                                  color: themeColors.accent,
                                }}
                              >
                                ({station.code})
                              </Text>
                            </Text>
                            <FontAwesome6
                              name="chevron-right"
                              size={11}
                              color={themeColors.subTextColor}
                            />
                          </TouchableOpacity>

                          {sIdx < activeTrip.outfieldHotelsList.length - 1 && (
                            <View
                              style={[
                                styles.inlineDivider,
                                { backgroundColor: themeColors.border },
                              ]}
                            />
                          )}
                        </View>
                      ))}
                  </View>
                );
              })()}

            {/* LOCATION INFO CONTAINER CARD */}
            {activeTrip.uniqueStationsList &&
              activeTrip.uniqueStationsList.length > 0 && (
                <View
                  style={[
                    styles.locationModuleCard,
                    {
                      borderColor: themeColors.border,
                      backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
                      marginTop: 16,
                    },
                  ]}
                >
                  {/* ─── ✅ FORMAT: Increased margin gap separation directly below header string line */}
                  <View
                    style={[styles.locationCardHeaderRow, { marginBottom: 12 }]}
                  >
                    <FontAwesome6
                      name="map-pin"
                      size={13}
                      color={themeColors.accent}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.locationCardTitleText,
                        { color: themeColors.textColor },
                      ]}
                    >
                      Location Info
                    </Text>
                  </View>

                  {activeTrip.uniqueStationsList.map((station, sIdx) => (
                    <View
                      key={station.code}
                      style={{ backgroundColor: "transparent" }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => {
                          router.push({
                            pathname: "/(tabs)/(notes)",
                            params: { stationCode: station.code },
                          });
                        }}
                        style={styles.stationInteractiveRow}
                      >
                        <Text
                          style={{
                            fontFamily: "GoogleSans",
                            fontSize: 14,
                            color: themeColors.textColor,
                            flex: 1,
                          }}
                        >
                          {station.fullNameClean}{" "}
                          <Text
                            style={{
                              fontFamily: "GoogleSansBold",
                              color: themeColors.accent,
                            }}
                          >
                            ({station.code})
                          </Text>
                        </Text>
                        <FontAwesome6
                          name="chevron-right"
                          size={11}
                          color={themeColors.subTextColor}
                        />
                      </TouchableOpacity>

                      {sIdx < activeTrip.uniqueStationsList.length - 1 && (
                        <View
                          style={[
                            styles.inlineDivider,
                            { backgroundColor: themeColors.border },
                          ]}
                        />
                      )}
                    </View>
                  ))}
                </View>
              )}
          </Animated.View>
        </View>
      )}

      {!loading && !activeTrip && (
        <View style={styles.centerContent}>
          <FontAwesome6
            name="plane-slash"
            size={32}
            color={themeColors.subTextColor}
            style={{ marginBottom: 12 }}
          />
          <Text
            style={[styles.placeholderTitle, { color: themeColors.textColor }]}
          >
            No Active Duties
          </Text>
          <Text style={[styles.subText, { color: themeColors.subTextColor }]}>
            There are no historical, current, or upcoming trips logged in your
            database roster manifest.
          </Text>
        </View>
      )}
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    height: 180,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 20,
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  centerContent: {
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 24,
  },
  activeContentContainer: {
    backgroundColor: "transparent",
    width: "100%",
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerControlStripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 20,
    width: "100%",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
  },
  utilityPillButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    marginRight: 6,
  },
  utilityPillText: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
  },
  stepperContainerRow: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    height: 32,
  },
  stepActionBtn: {
    width: 38,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tripMetaBlock: {
    backgroundColor: "transparent",
    width: "100%",
    marginBottom: 24,
  },
  routingSummaryText: {
    fontFamily: "GoogleSansBold",
    fontSize: 18,
    letterSpacing: -0.2,
  },
  timelinePipelineContainer: {
    flexDirection: "row",
    backgroundColor: "transparent",
    width: "100%",
    position: "relative",
    marginBottom: 20,
  },
  verticalTimelinePipe: {
    position: "absolute",
    left: 11,
    top: 4,
    bottom: 20,
    width: 2,
    borderRadius: 1,
  },
  rowsWrapperBlock: {
    flex: 1,
    backgroundColor: "transparent",
    paddingLeft: 32,
  },
  itineraryItemRow: {
    backgroundColor: "transparent",
    marginVertical: 8,
    width: "100%",
    position: "relative",
  },
  pipeCircleNode: {
    position: "absolute",
    left: -32,
    top: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  elementDataBlock: {
    backgroundColor: "transparent",
    flex: 1,
    paddingBottom: 4,
  },
  locationModuleCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    marginTop: 12,
  },
  locationCardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    width: "100%",
  },
  locationCardTitleText: {
    fontFamily: "GoogleSansBold",
    fontSize: 14,
    letterSpacing: -0.1,
  },
  stationInteractiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    // ─── ✅ FORMAT: Rows are now tightly packed and closer together
    paddingVertical: 4,
    width: "100%",
  },
  inlineDivider: {
    width: "100%",
    height: 1,
    opacity: 0.15,
  },
  placeholderTitle: {
    fontFamily: "GoogleSansBold",
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
