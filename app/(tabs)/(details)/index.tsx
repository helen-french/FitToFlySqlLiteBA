import { FontAwesome6 } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ViewToken,
} from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/Header";
import { Text, View } from "@/components/Themed";
import CalendarCard from "@/components/summary/CalendarCard";
import SkyHeader from "@/components/ui/SkyHeader";

import { db } from "@/db/db";
import {
  crewMembers,
  dataLoad,
  duties,
  groundDuties,
  GroundDuty,
  roster,
  Sector,
  sectors,
  Trip,
  tripCrew,
  trips,
} from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

interface ItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  data?: Sector & { actualReportTime?: string | null };
}

interface UnifiedTimelineRow {
  id: string;
  type: "T" | "G";
  startDate: string;
  tripData?: {
    tripMeta: Trip;
    routingSummary: string;
    timeline: ItineraryItem[];
    calculatedStartDate: string;
    calculatedEndDate: string;
  };
  groundData?: GroundDuty;
}

type FilterType = "ALL" | "TRIPS" | "GROUND";

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
      timelinePipe: "#34C759",
    }),
    [isDark],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [timelineRows, setTimelineRows] = useState<UnifiedTimelineRow[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  const [expandedTrips, setExpandedTrips] = useState<{
    [key: string]: boolean;
  }>({});
  const [fetchingCrewForTrip, setFetchingCrewForTrip] = useState<{
    [key: string]: boolean;
  }>({});

  const todayAnchor = useMemo(() => new Date("2026-06-16T12:00:00"), []);
  const [selectedDate, setSelectedDate] = useState<Date>(todayAnchor);
  const [currentViewMonth, setCurrentViewMonth] = useState<Date>(todayAnchor);
  const [isMonthExpanded, setIsMonthExpanded] = useState<boolean>(false);

  const flatListRef = useRef<FlatList<UnifiedTimelineRow>>(null);
  const isAutoScrolling = useRef<boolean>(false);
  const hasInitiallySynced = useRef<boolean>(false);

  const filteredTimelineRows = useMemo(() => {
    if (filterType === "TRIPS")
      return timelineRows.filter((row) => row.type === "T");
    if (filterType === "GROUND")
      return timelineRows.filter((row) => row.type === "G");
    return timelineRows;
  }, [timelineRows, filterType]);

  const toggleTripAccordion = (tripNumber: string) => {
    setExpandedTrips((prev) => ({ ...prev, [tripNumber]: !prev[tripNumber] }));
  };

  const handleViewTripCrew = async (tripNumber: string) => {
    try {
      setFetchingCrewForTrip((prev) => ({ ...prev, [tripNumber]: true }));
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
        .where(eq(tripCrew.tripNumber, tripNumber))
        .orderBy(asc(tripCrew.crewFunction));

      if (assignedRosterCrew.length === 0) {
        Alert.alert(
          "✈️ Roster Crew",
          `No operating crew records found logged for Trip (${tripNumber}).`,
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
        `✈️ Roster Crew (${tripNumber})`,
        formattedCrewStrings.join("\n"),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingCrewForTrip((prev) => ({ ...prev, [tripNumber]: false }));
    }
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

  const scrollToDateInList = useCallback(
    (targetDate: Date) => {
      if (filteredTimelineRows.length === 0) return;
      const dateKey = getLocalDateString(targetDate);

      const targetIndex = filteredTimelineRows.findIndex((row) => {
        if (row.type === "T" && row.tripData) {
          return (
            dateKey >= row.tripData.calculatedStartDate &&
            dateKey <= row.tripData.calculatedEndDate
          );
        }
        return row.startDate === dateKey;
      });

      const finalIndex =
        targetIndex !== -1
          ? targetIndex
          : filteredTimelineRows.findIndex((row) => row.startDate >= dateKey);

      if (finalIndex !== -1 && flatListRef.current) {
        isAutoScrolling.current = true;
        try {
          flatListRef.current.scrollToIndex({
            index: finalIndex,
            animated: true,
            viewPosition: 0,
          });
          setTimeout(() => {
            isAutoScrolling.current = false;
          }, 450);
        } catch (error) {
          isAutoScrolling.current = false;
        }
      }
    },
    [filteredTimelineRows, getLocalDateString],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (
        isAutoScrolling.current ||
        viewableItems.length === 0 ||
        filteredTimelineRows.length === 0
      )
        return;

      const topVisibleItem = viewableItems[0].item as UnifiedTimelineRow;
      if (!topVisibleItem) return;

      const rowDateStr =
        topVisibleItem.type === "T" && topVisibleItem.tripData
          ? topVisibleItem.tripData.calculatedStartDate
          : topVisibleItem.startDate;

      const itemDateObj = new Date(`${rowDateStr}T12:00:00`);
      if (!isNaN(itemDateObj.getTime())) {
        setSelectedDate(itemDateObj);
        setCurrentViewMonth(itemDateObj);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 15 }).current;

  const loadSummaryData = useCallback(async () => {
    try {
      setIsLoading(true);

      const activeManifests = await db
        .select({ id: dataLoad.id })
        .from(dataLoad);

      if (activeManifests.length === 0) {
        setTimelineRows([]);
        setIsLoading(false);
        return;
      }

      const activeIds = activeManifests.map((m) => m.id);

      const activeRosterTimeline = await db
        .select()
        .from(roster)
        .where(eq(roster.dataLoadId, activeIds[activeIds.length - 1])) // Fetch active database rows
        .orderBy(asc(roster.startDate));

      const masterUnifiedRows: UnifiedTimelineRow[] = [];

      for (const indexNode of activeRosterTimeline) {
        if (indexNode.type === "T" && indexNode.tripNumber) {
          const tripTarget = await db
            .select()
            .from(trips)
            .where(eq(trips.tripNumber, indexNode.tripNumber))
            .limit(1);
          if (tripTarget.length === 0) continue;

          const currentTrip = tripTarget[0];
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

          masterUnifiedRows.push({
            id: `TRIP_${currentTrip.tripNumber}`,
            type: "T",
            startDate: indexNode.startDate,
            tripData: {
              tripMeta: currentTrip,
              routingSummary,
              timeline,
              calculatedStartDate: timeline[0].dateStr,
              calculatedEndDate: timeline[timeline.length - 1].dateStr,
            },
          });
        } else if (indexNode.type === "G" && indexNode.groundDutyId) {
          const groundTarget = await db
            .select()
            .from(groundDuties)
            .where(eq(groundDuties.id, indexNode.groundDutyId))
            .limit(1);
          if (groundTarget.length === 0) continue;

          masterUnifiedRows.push({
            id: `GROUND_${groundTarget[0].id}`,
            type: "G",
            startDate: indexNode.startDate,
            groundData: groundTarget[0],
          });
        }
      }

      setTimelineRows(masterUnifiedRows);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSummaryData();
    }, [loadSummaryData]),
  );

  useEffect(() => {
    if (!isLoading && filteredTimelineRows.length > 0) {
      const timer = setTimeout(() => {
        scrollToDateInList(selectedDate);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isLoading, filterType]);

  useEffect(() => {
    if (
      !isLoading &&
      filteredTimelineRows.length > 0 &&
      !hasInitiallySynced.current
    ) {
      const timer = setTimeout(() => {
        scrollToDateInList(todayAnchor);
        hasInitiallySynced.current = true;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, filteredTimelineRows, todayAnchor, scrollToDateInList]);

  const dutyMarkerMap = useMemo(() => {
    const map: { [dateKey: string]: "flight" | "layover" | "ground" } = {};
    timelineRows.forEach((row) => {
      if (row.type === "T" && row.tripData) {
        row.tripData.timeline.forEach((item) => {
          map[item.dateStr] = item.type;
        });
      } else if (row.type === "G") {
        map[row.startDate] = "ground";
      }
    });
    return map;
  }, [timelineRows]);

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

  const renderTimelineItem = useCallback(
    ({ item }: { item: UnifiedTimelineRow }) => {
      if (item.type === "T" && item.tripData) {
        const rotation = item.tripData;
        const isExpanded = !!expandedTrips[rotation.tripMeta.tripNumber];
        const isCrewLoading =
          !!fetchingCrewForTrip[rotation.tripMeta.tripNumber];

        return (
          <Animated.View
            style={[
              styles.tripContainerCard,
              { backgroundColor: themeColors.cardBg },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleTripAccordion(rotation.tripMeta.tripNumber)}
              style={styles.nestedCardHeaderRow}
            >
              <View style={{ backgroundColor: "transparent", flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "GoogleSansBold",
                    fontSize: 13,
                    color: themeColors.textColor,
                    marginBottom: 4,
                  }}
                >
                  {formatCardHeaderDate(rotation.calculatedStartDate)} —{" "}
                  {formatCardHeaderDate(rotation.calculatedEndDate)}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "transparent",
                  }}
                >
                  <FontAwesome6
                    name="plane-departure"
                    size={12}
                    color={themeColors.accent}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.routingSummaryText,
                      { color: themeColors.textColor },
                    ]}
                  >
                    {rotation.routingSummary}
                  </Text>
                </View>
              </View>

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
                    fontSize: 13,
                    color: themeColors.subTextColor,
                    marginRight: 10,
                  }}
                >
                  {(() => {
                    const start = new Date(
                      `${rotation.calculatedStartDate}T12:00:00`,
                    );
                    const end = new Date(
                      `${rotation.calculatedEndDate}T12:00:00`,
                    );
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(
                      diffTime / (1000 * 60 * 60 * 24),
                    );
                    return `${diffDays + 1} ${diffDays + 1 === 1 ? "Day" : "Days"}`;
                  })()}
                </Text>
                <FontAwesome6
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={themeColors.subTextColor}
                />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <Animated.View
                entering={FadeInUp.duration(250)}
                exiting={FadeOutDown.duration(200)}
                style={styles.accordionDetailsTray}
              >
                {rotation.tripMeta.creditAmount &&
                  (() => {
                    const rawCredit = rotation.tripMeta.creditAmount.replace(
                      "PT",
                      "",
                    );
                    if (!rawCredit || rawCredit === "0M") return null;
                    const partsCredit = rawCredit.split("H");
                    return (
                      <Text
                        style={[
                          styles.tripCreditSubtitleText,
                          { color: themeColors.subTextColor },
                        ]}
                      >
                        {parseInt(partsCredit[0], 10) || 0}hrs{" "}
                        {partsCredit.length > 1
                          ? parseInt(partsCredit[1].replace("M", ""), 10) || 0
                          : 0}
                        mins
                      </Text>
                    );
                  })()}

                <View
                  style={[
                    styles.nestedHeaderDividerLine,
                    { borderBottomColor: themeColors.border },
                  ]}
                />

                <View style={styles.tripLevelUtilityRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={isCrewLoading}
                    onPress={() =>
                      handleViewTripCrew(rotation.tripMeta.tripNumber)
                    }
                    style={[
                      styles.tripCrewButton,
                      {
                        backgroundColor: themeColors.nestedBoxBg,
                        borderColor: themeColors.border,
                        marginRight: 8,
                      },
                    ]}
                  >
                    {isCrewLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={themeColors.accent}
                        style={{ marginRight: 6 }}
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
                      style={{
                        fontFamily: "GoogleSansBold",
                        fontSize: 11,
                        color: themeColors.textColor,
                      }}
                    >
                      Crew
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timelinePipelineContainer}>
                  <View
                    style={[
                      styles.verticalTimelinePipe,
                      { backgroundColor: themeColors.timelinePipe },
                    ]}
                  />
                  <View style={styles.rowsWrapperBlock}>
                    {rotation.timeline.map((item, index) => (
                      <View key={index} style={styles.itineraryItemRow}>
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
                            {item.data?.actualReportTime && (
                              <Text
                                style={{
                                  fontFamily: "GoogleSans",
                                  fontSize: 13,
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
                                  item.data.departureTime.split("T")[1]}{" "}
                                —{" "}
                                {item.data.arrivalTimeLocal ||
                                  item.data.arrivalTime}
                              </Text>
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
              </Animated.View>
            )}
          </Animated.View>
        );
      }

      if (item.type === "G" && item.groundData) {
        const gd = item.groundData;
        return (
          <Animated.View
            style={[
              styles.tripContainerCard,
              { backgroundColor: themeColors.cardBg, paddingVertical: 14 },
            ]}
          >
            <View style={{ backgroundColor: "transparent", width: "100%" }}>
              <Text
                style={{
                  fontFamily: "GoogleSansBold",
                  fontSize: 13,
                  color: themeColors.textColor,
                  marginBottom: 4,
                }}
              >
                {formatCardHeaderDate(gd.startDate)}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}
              >
                <FontAwesome6
                  name="plane-slash"
                  size={13}
                  color="#FF9500"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.routingSummaryText,
                    { color: themeColors.textColor },
                  ]}
                >
                  Ground Duty{" "}
                  <Text
                    style={{
                      fontFamily: "GoogleSans",
                      color: themeColors.subTextColor,
                      fontSize: 14,
                    }}
                  >
                    | {gd.crewMovementCode}
                  </Text>
                </Text>
              </View>
            </View>
          </Animated.View>
        );
      }
      return null;
    },
    [expandedTrips, fetchingCrewForTrip, themeColors, formatCardHeaderDate],
  );

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
          scrollToDateInList(date);
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

          // Force align to first element of newly navigated month frame
          setTimeout(() => scrollToDateInList(newDate), 50);
        }}
        onResetToday={() => {
          setSelectedDate(todayAnchor);
          setCurrentViewMonth(todayAnchor);
          scrollToDateInList(todayAnchor);
        }}
        onToggleExpand={() => setIsMonthExpanded(!isMonthExpanded)}
      />

      <View
        style={[
          styles.segmentContainer,
          { backgroundColor: isDark ? "#1C1C1E" : "#E5E5EA" },
        ]}
      >
        {["ALL", "TRIPS", "GROUND"].map((type) => (
          <TouchableOpacity
            key={type}
            activeOpacity={0.8}
            onPress={() => setFilterType(type as FilterType)}
            style={[
              styles.segmentButton,
              filterType === type && [
                styles.segmentActivePill,
                { backgroundColor: themeColors.nestedBoxBg },
              ],
            ]}
          >
            <Text
              style={[
                styles.segmentLabel,
                {
                  color:
                    filterType === type
                      ? themeColors.textColor
                      : themeColors.subTextColor,
                },
              ]}
            >
              {type === "ALL" ? "All" : type === "TRIPS" ? "Trips" : "Ground"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={filteredTimelineRows}
        keyExtractor={(item) => item.id}
        renderItem={renderTimelineItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={false}
        style={styles.container}
        contentContainerStyle={styles.mainScrollContentPadding}
        // ──✅ FIXED: Appends virtual pre-render window sizing config parameters to bypass lazy load barriers
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        // ──✅ FIXED: Safe index failure catch intercepts offscreen rendering bounds beautifully
        onScrollToIndexFailed={(info) => {
          const waitTimer = setTimeout(() => {
            if (flatListRef.current && filteredTimelineRows.length > 0) {
              flatListRef.current.scrollToIndex({
                index: Math.min(info.index, filteredTimelineRows.length - 1),
                animated: true,
                viewPosition: 0,
              });
            }
          }, 80);
          return () => clearTimeout(waitTimer);
        }}
        ListEmptyComponent={
          <View style={styles.emptyComponentBlock}>
            <Text
              style={{
                fontFamily: "GoogleSans",
                color: themeColors.subTextColor,
                fontSize: 14,
              }}
            >
              No items match this filter category.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  mainScrollContentPadding: { paddingBottom: 140 },
  absoluteSkyPosition: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  segmentContainer: {
    flexDirection: "row",
    height: 38,
    borderRadius: 12,
    padding: 3,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 9,
  },
  segmentActivePill: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 2,
  },
  segmentLabel: { fontFamily: "GoogleSansBold", fontSize: 13 },
  emptyComponentBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
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
  accordionDetailsTray: {
    backgroundColor: "transparent",
    marginTop: 0,
    width: "100%",
  },
  tripCreditSubtitleText: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    marginTop: 4,
    paddingLeft: 18,
  },
  nestedHeaderDividerLine: {
    borderBottomWidth: 1,
    marginBottom: 10,
    marginTop: 8,
    opacity: 0.15,
  },
  tripLevelUtilityRow: {
    flexDirection: "row",
    backgroundColor: "transparent",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  tripCrewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
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
  elementDataBlock: { backgroundColor: "transparent", flex: 1 },
});
