import { FontAwesome6 } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeInUp,
  FadeOutDown,
  LinearTransition,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/Header";
import { Text, View } from "@/components/Themed";
import CalendarCard from "@/components/summary/CalendarCard";
import SkyHeader from "@/components/ui/SkyHeader";

import { db } from "@/db/db";
import { and, asc, eq } from "drizzle-orm";
//import { duties, Sector, sectors, Trip, trips } from "../../db/schema";
import { duties, Sector, sectors, Trip, trips } from "@/db/schema";

interface ItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  data?: Sector & { actualReportTime?: string | null };
}

interface GroupedTripRotation {
  tripMeta: Trip;
  routingSummary: string;
  timeline: ItineraryItem[];
  calculatedStartDate: string;
  calculatedEndDate: string;
}

export default function DetailsSummaryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      pageBg: isDark ? "#000000" : "#FFFFFF",
      calendarCardBg: isDark
        ? "rgba(28, 28, 30, 0.85)"
        : "rgba(242, 242, 247, 0.85)",
      cardBg: isDark ? "#1C1C1E" : "#FFFFFF",
      nestedBoxBg: isDark ? "#2C2C2E" : "#F8F9FA",
      border: isDark ? "rgba(56, 56, 58, 0.4)" : "rgba(229, 229, 234, 0.6)",
      accent: "#007AFF",
      timelinePipe: "#34C759", // Green pipe timeline color matching your home screen asset
    }),
    [isDark],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [groupedTrips, setGroupedTrips] = useState<GroupedTripRotation[]>([]);
  const [expandedTrips, setExpandedTrips] = useState<{
    [key: string]: boolean;
  }>({});

  const initialToday = useMemo(() => new Date("2026-06-08"), []);
  const [selectedDate, setSelectedDate] = useState<Date>(initialToday);
  const [currentViewMonth, setCurrentViewMonth] = useState<Date>(initialToday);
  const [isMonthExpanded, setIsMonthExpanded] = useState<boolean>(false);

  const mainScrollRef = useRef<ScrollView>(null);
  const tripLayoutYPositions = useRef<{ [key: string]: number }>({});
  const isAutoScrolling = useRef<boolean>(false);
  const hasInitiallySynced = useRef<boolean>(false);

  const toggleTripAccordion = (tripNumber: string) => {
    setExpandedTrips((prev) => ({
      ...prev,
      [tripNumber]: !prev[tripNumber],
    }));
  };

  const getLocalDateString = useCallback((date: Date): string => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().split("T")[0];
  }, []);

  const formatCardHeaderDate = useCallback((dateStr: string) => {
    if (!dateStr || !dateStr.includes("-")) return dateStr;
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }, []);

  const loadSummaryData = useCallback(async () => {
    try {
      setIsLoading(true);
      const allTrips = await db
        .select()
        .from(trips)
        .orderBy(asc(trips.startDate));
      const processedRotations: GroupedTripRotation[] = [];

      for (const currentTrip of allTrips) {
        const tripSectors = await db
          .select({
            id: sectors.id,
            tripNumber: sectors.tripNumber,
            dutyNumber: sectors.dutyNumber,
            sectorNumber: sectors.sectorNumber,
            carrier: sectors.carrier,
            flightNumber: sectors.flightNumber,
            aircraftTypeSpecific: sectors.aircraftTypeSpecific,
            departureStation: sectors.departureStation,
            arrivalStation: sectors.arrivalStation,
            departureTime: sectors.departureTime,
            departureTimeLocal: sectors.departureTimeLocal,
            departureTimeShift: sectors.departureTimeShift,
            arrivalTime: sectors.arrivalTime,
            arrivalTimeLocal: sectors.arrivalTimeLocal,
            arrivalTimeShift: sectors.arrivalTimeShift,
            relativeDepartureDay: sectors.relativeDepartureDay,
            sectorType: sectors.sectorType,
            heavyCrewIdentifier: sectors.heavyCrewIdentifier,
            flyingHours: sectors.flyingHours,
            flyingHoursCredit: sectors.flyingHoursCredit,
            scheduleIndicator: sectors.scheduleIndicator,
            createdAt: sectors.createdAt,
            updatedAt: sectors.updatedAt,
            actualReportTime: duties.actualReportTime,
          })
          .from(sectors)
          .innerJoin(
            duties,
            and(
              eq(sectors.tripNumber, duties.tripNumber),
              eq(sectors.dutyNumber, duties.dutyNumber),
            ),
          )
          .where(eq(sectors.tripNumber, currentTrip.tripNumber))
          .orderBy(asc(sectors.departureTime), asc(sectors.sectorNumber));

        if (tripSectors.length === 0) continue;

        const stations = [tripSectors[0].departureStation];
        tripSectors.forEach((s) => {
          if (stations[stations.length - 1] !== s.arrivalStation)
            stations.push(s.arrivalStation);
        });
        const routingSummary = stations.join(" → ");

        const timeline: ItineraryItem[] = [];
        for (let i = 0; i < tripSectors.length; i++) {
          const currentSector = tripSectors[i];
          const currentLocDate = currentSector.departureTime.split("T")[0];
          timeline.push({
            type: "flight",
            dateStr: currentLocDate,
            data: currentSector,
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

        processedRotations.push({
          tripMeta: currentTrip,
          routingSummary,
          timeline,
          calculatedStartDate: timeline[0].dateStr,
          calculatedEndDate: timeline[timeline.length - 1].dateStr,
        });
      }
      setGroupedTrips(processedRotations);
      hasInitiallySynced.current = false;
    } catch (err) {
      console.error("Accordion Summary data read failure:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSummaryData();
    }, [loadSummaryData]),
  );

  const dutyMarkerMap = useMemo(() => {
    const map: { [dateKey: string]: "flight" | "layover" } = {};
    groupedTrips.forEach((rot) =>
      rot.timeline.forEach((item) => {
        map[item.dateStr] = item.type;
      }),
    );
    return map;
  }, [groupedTrips]);

  const weeklyCalendarDays = useMemo(() => {
    const startOfWeek = new Date(currentViewMonth);
    const dayIndex = startOfWeek.getDay();
    startOfWeek.setDate(
      startOfWeek.getDate() + (dayIndex === 0 ? -6 : 1 - dayIndex),
    );
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [currentViewMonth]);

  const monthlyCalendarDays = useMemo(() => {
    const firstDay = new Date(
      currentViewMonth.getFullYear(),
      currentViewMonth.getMonth(),
      1,
    );
    const startDayIndex = firstDay.getDay();
    firstDay.setDate(
      firstDay.getDate() + (startDayIndex === 0 ? -6 : 1 - startDayIndex),
    );
    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(firstDay);
      d.setDate(firstDay.getDate() + i);
      return d;
    });
  }, [currentViewMonth]);

  const activeCalendarDays = isMonthExpanded
    ? monthlyCalendarDays
    : weeklyCalendarDays;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeColors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.pageBg }]}
    >
      <SkyHeader
        height={190}
        showClouds={true}
        style={styles.absoluteSkyPosition}
      />
      <Header onImportSuccess={loadSummaryData} />

      <CalendarCard
        activeCalendarDays={activeCalendarDays}
        selectedDate={selectedDate}
        currentViewMonth={currentViewMonth}
        isMonthExpanded={isMonthExpanded}
        dutyMarkerMap={dutyMarkerMap}
        themeColors={{ ...themeColors, cardBg: themeColors.calendarCardBg }}
        getLocalDateString={getLocalDateString}
        onDaySelect={(date) => {
          setSelectedDate(date);
          setCurrentViewMonth(date);
        }}
        onNavigate={(dir) => {
          const newDate = new Date(currentViewMonth);
          if (isMonthExpanded)
            newDate.setMonth(
              currentViewMonth.getMonth() + (dir === "next" ? 1 : -1),
            );
          else
            newDate.setDate(
              currentViewMonth.getDate() + (dir === "next" ? 7 : -7),
            );
          setCurrentViewMonth(newDate);
        }}
        onResetToday={() => {
          setSelectedDate(initialToday);
          setCurrentViewMonth(initialToday);
        }}
        onToggleExpand={() => setIsMonthExpanded(!isMonthExpanded)}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        <View style={styles.contentWrapper}>
          {groupedTrips.map((rotation) => {
            const isExpanded = !!expandedTrips[rotation.tripMeta.tripNumber];
            return (
              <Animated.View
                key={rotation.tripMeta.tripNumber}
                layout={LinearTransition.duration(300)}
                style={[
                  styles.tripContainerCard,
                  { backgroundColor: themeColors.cardBg },
                ]}
              >
                {/* ACCORDION HEADER TRIGGER */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    toggleTripAccordion(rotation.tripMeta.tripNumber)
                  }
                  style={styles.nestedCardHeaderRow}
                >
                  <View style={{ backgroundColor: "transparent", flex: 1 }}>
                    <Text
                      style={[
                        styles.routingSummaryText,
                        { color: themeColors.textColor },
                      ]}
                    >
                      {rotation.routingSummary}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "GoogleSans",
                        fontSize: 12,
                        color: themeColors.subTextColor,
                        marginTop: 2,
                      }}
                    >
                      {formatCardHeaderDate(rotation.calculatedStartDate)} —{" "}
                      {formatCardHeaderDate(rotation.calculatedEndDate)}
                    </Text>
                  </View>
                  <View style={styles.headerRightElement}>
                    <FontAwesome6
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={themeColors.subTextColor}
                    />
                  </View>
                </TouchableOpacity>

                {/* ACCORDION EXPANDABLE BODY */}
                {isExpanded && (
                  <Animated.View
                    entering={FadeInUp.duration(250)}
                    exiting={FadeOutDown.duration(200)}
                    style={styles.accordionDetailsTray}
                  >
                    <View
                      style={[
                        styles.nestedHeaderDividerLine,
                        { borderBottomColor: themeColors.border },
                      ]}
                    />

                    {/* TIMELINE TRACK WITH PIPE CHANNEL ACCENT */}
                    <View style={styles.timelinePipelineContainer}>
                      {/* Vertical line extending alongside content */}
                      <View
                        style={[
                          styles.verticalTimelinePipe,
                          { backgroundColor: themeColors.timelinePipe },
                        ]}
                      />

                      <View style={styles.rowsWrapperBlock}>
                        {rotation.timeline.map((item, index) => (
                          <View key={index} style={styles.itineraryItemRow}>
                            {/* Pipeline node indicator */}
                            <View
                              style={[
                                styles.pipeCircleNode,
                                {
                                  borderColor: themeColors.timelinePipe,
                                  backgroundColor: themeColors.cardBg,
                                },
                              ]}
                            >
                              <FontAwesome6
                                name={
                                  item.type === "flight" ? "plane" : "hotel"
                                }
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
                                {item.data?.actualReportTime && (
                                  <Text
                                    style={{
                                      fontFamily: "GoogleSans",
                                      fontSize: 13,
                                      color: themeColors.subTextColor,
                                      marginLeft: 8,
                                    }}
                                  >
                                    (Report: {item.data.actualReportTime})
                                  </Text>
                                )}
                              </View>

                              {item.type === "flight" && item.data ? (
                                <View
                                  style={{
                                    backgroundColor: "transparent",
                                    marginTop: 4,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontFamily: "GoogleSans",
                                      fontSize: 14,
                                      color: themeColors.textColor,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontFamily: "GoogleSansBold",
                                        color: themeColors.accent,
                                      }}
                                    >
                                      {item.data.carrier}
                                      {item.data.flightNumber}
                                    </Text>{" "}
                                    {item.data.departureStation} →{" "}
                                    {item.data.arrivalStation}
                                  </Text>
                                  <Text
                                    style={{
                                      fontFamily: "GoogleSans",
                                      fontSize: 13,
                                      color: themeColors.subTextColor,
                                      marginTop: 2,
                                    }}
                                  >
                                    {item.data.departureTimeLocal ||
                                      item.data.departureTime.split(
                                        "T",
                                      )[1]}{" "}
                                    —{" "}
                                    {item.data.arrivalTimeLocal ||
                                      item.data.arrivalTime}
                                    {item.data.flyingHours &&
                                      (() => {
                                        const raw =
                                          item.data.flyingHours.replace(
                                            "PT",
                                            "",
                                          );
                                        const parts = raw.split("H");
                                        const hours =
                                          parseInt(parts[0], 10) || 0;
                                        const minutes =
                                          parts.length > 1
                                            ? parseInt(
                                                parts[1].replace("M", ""),
                                                10,
                                              ) || 0
                                            : 0;
                                        return `  |  ${hours}hrs ${minutes}mins`;
                                      })()}
                                  </Text>
                                </View>
                              ) : (
                                <Text
                                  style={{
                                    fontFamily: "GoogleSans",
                                    fontSize: 14,
                                    color: themeColors.subTextColor,
                                    marginTop: 2,
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
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  absoluteSkyPosition: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  contentWrapper: { paddingHorizontal: 20, paddingTop: 10, width: "100%" },
  tripContainerCard: {
    borderRadius: 20,
    padding: 16,
    width: "100%",
    marginBottom: 16,
    overflow: "hidden",
  },
  nestedCardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    width: "100%",
  },
  routingSummaryText: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  headerRightElement: { backgroundColor: "transparent", marginLeft: 10 },
  accordionDetailsTray: {
    backgroundColor: "transparent",
    marginTop: 4,
    width: "100%",
  },
  nestedHeaderDividerLine: {
    borderBottomWidth: 1,
    marginBottom: 16,
    marginTop: 12,
    opacity: 0.15,
  },
  timelinePipelineContainer: {
    flexDirection: "row",
    backgroundColor: "transparent",
    width: "100%",
    position: "relative",
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
    marginVertical: 10,
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
  elementDataBlock: { backgroundColor: "transparent", flex: 1 },
});
