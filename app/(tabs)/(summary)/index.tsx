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
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/Header";
import { Text, View } from "@/components/Themed";

import { db } from "@/db/db";
import { asc, eq } from "drizzle-orm";
import { Sector, sectors, Trip, trips } from "../../../db/schema";

interface ItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  data?: Sector;
}

interface GroupedTripRotation {
  tripMeta: Trip;
  routingSummary: string;
  timeline: ItineraryItem[];
  calculatedStartDate: string;
  calculatedEndDate: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SummaryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const themeTextColor = isDark ? "#FFFFFF" : "#1A1A1A";
  const themeSubTextColor = isDark ? "#A0A0A0" : "#666666";
  const themePageBg = isDark ? "#000000" : "#FFFFFF";
  const themeCardBg = isDark ? "#1C1C1E" : "#F2F2F7";
  const themeNestedBoxBg = isDark ? "#2C2C2E" : "#FFFFFF";
  const themeBorder = isDark ? "#38383A" : "#E5E5EA";
  const themeAccent = "#007AFF";

  const [isLoading, setIsLoading] = useState(true);
  const [groupedTrips, setGroupedTrips] = useState<GroupedTripRotation[]>([]);

  // Calendar State Parameters (Today: June 8, 2026)
  const initialToday = useMemo(() => new Date("2026-06-08"), []);
  const [selectedDate, setSelectedDate] = useState<Date>(initialToday);
  const [currentViewMonth, setCurrentViewMonth] = useState<Date>(initialToday);
  const [isMonthExpanded, setIsMonthExpanded] = useState<boolean>(false);

  const mainScrollRef = useRef<ScrollView>(null);
  const tripLayoutYPositions = useRef<{ [key: string]: number }>({});
  const isAutoScrolling = useRef<boolean>(false);
  const hasInitiallySynced = useRef<boolean>(false);

  const getLocalDateString = (date: Date): string => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().split("T")[0];
  };

  const formatVerbalDuration = (isoDuration: string | null) => {
    if (!isoDuration) return "0 hours 0 minutes";
    const raw = isoDuration.replace("PT", "");
    const parts = raw.split("H");

    let hours = 0;
    let minutes = 0;

    if (parts.length > 1) {
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1].replace("M", ""), 10) || 0;
    } else {
      minutes = parseInt(parts[0].replace("M", ""), 10) || 0;
    }

    return `${hours} ${hours === 1 ? "hour" : "hours"} ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  };

  const formatCardHeaderDate = (dateStr: string) => {
    try {
      if (!dateStr || !dateStr.includes("-")) return dateStr;
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

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
          .select()
          .from(sectors)
          .where(eq(sectors.tripNumber, currentTrip.tripNumber))
          .orderBy(asc(sectors.departureTime), asc(sectors.sectorNumber));

        if (tripSectors.length === 0) continue;

        const stations = [tripSectors[0].departureStation];
        tripSectors.forEach((s) => {
          if (stations[stations.length - 1] !== s.arrivalStation) {
            stations.push(s.arrivalStation);
          }
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
              const diffTime = Math.abs(
                nextDateObj.getTime() - currentDateObj.getTime(),
              );
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

        const calculatedStartDate = timeline[0].dateStr;
        const calculatedEndDate = timeline[timeline.length - 1].dateStr;

        processedRotations.push({
          tripMeta: currentTrip,
          routingSummary,
          timeline,
          calculatedStartDate,
          calculatedEndDate,
        });
      }

      setGroupedTrips(processedRotations);
      hasInitiallySynced.current = false;
    } catch (err) {
      console.error("Summary processing failure:", err);
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
    groupedTrips.forEach((rot) => {
      rot.timeline.forEach((item) => {
        map[item.dateStr] = item.type;
      });
    });
    return map;
  }, [groupedTrips]);

  const weeklyCalendarDays = useMemo(() => {
    const startOfWeek = new Date(currentViewMonth);
    const dayIndex = startOfWeek.getDay();
    const distanceToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
    startOfWeek.setDate(startOfWeek.getDate() + distanceToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentViewMonth]);

  const monthlyCalendarDays = useMemo(() => {
    const year = currentViewMonth.getFullYear();
    const month = currentViewMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);

    const startDayIndex = firstDayOfMonth.getDay();
    const distanceToFirstMonday = startDayIndex === 0 ? -6 : 1 - startDayIndex;

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() + distanceToFirstMonday);

    const days = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentViewMonth]);

  const scrollToDateInList = useCallback(
    (targetDate: Date) => {
      if (groupedTrips.length === 0) return;

      const dateKey = getLocalDateString(targetDate);

      const matchedRotation =
        groupedTrips.find((rot) => {
          return (
            dateKey >= rot.calculatedStartDate &&
            dateKey <= rot.calculatedEndDate
          );
        }) || groupedTrips.find((rot) => rot.calculatedStartDate >= dateKey);

      if (matchedRotation && mainScrollRef.current) {
        const targetY =
          tripLayoutYPositions.current[matchedRotation.tripMeta.tripNumber];
        if (typeof targetY === "number") {
          isAutoScrolling.current = true;
          mainScrollRef.current.scrollTo({ y: targetY, animated: true });
          setTimeout(() => {
            isAutoScrolling.current = false;
          }, 450);
        }
      }
    },
    [groupedTrips],
  );

  useEffect(() => {
    if (!isLoading && groupedTrips.length > 0 && !hasInitiallySynced.current) {
      const timer = setTimeout(() => {
        scrollToDateInList(selectedDate);
        hasInitiallySynced.current = true;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, groupedTrips, selectedDate, scrollToDateInList]);

  const handleCalendarDaySelection = (targetDate: Date) => {
    setSelectedDate(targetDate);
    setCurrentViewMonth(targetDate);
    scrollToDateInList(targetDate);
  };

  const handleScrollUpdateCalendarHighlight = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isAutoScrolling.current || groupedTrips.length === 0) return;

    const scrollY = event.nativeEvent.contentOffset.y;
    let currentVisibleTripId = groupedTrips[0].tripMeta.tripNumber;

    for (const rotation of groupedTrips) {
      const positionY =
        tripLayoutYPositions.current[rotation.tripMeta.tripNumber] || 0;
      if (scrollY >= positionY - 30) {
        currentVisibleTripId = rotation.tripMeta.tripNumber;
      }
    }

    const visibleRotation = groupedTrips.find(
      (r) => r.tripMeta.tripNumber === currentVisibleTripId,
    );
    if (visibleRotation) {
      const activeSelectedKey = getLocalDateString(selectedDate);

      if (
        activeSelectedKey >= visibleRotation.calculatedStartDate &&
        activeSelectedKey <= visibleRotation.calculatedEndDate
      ) {
        return;
      }

      const tripDateObj = new Date(
        `${visibleRotation.calculatedStartDate}T12:00:00`,
      );
      if (!isNaN(tripDateObj.getTime())) {
        setSelectedDate(tripDateObj);
        setCurrentViewMonth(tripDateObj);
      }
    }
  };

  const handleNavigateCalendar = (direction: "prev" | "next") => {
    const newDate = new Date(currentViewMonth);
    if (isMonthExpanded) {
      newDate.setMonth(
        currentViewMonth.getMonth() + (direction === "next" ? 1 : -1),
      );
    } else {
      newDate.setDate(
        currentViewMonth.getDate() + (direction === "next" ? 7 : -7),
      );
    }
    setCurrentViewMonth(newDate);
  };

  const handleResetToToday = () => {
    handleCalendarDaySelection(initialToday);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeAccent} />
      </View>
    );
  }

  const activeCalendarDays = isMonthExpanded
    ? monthlyCalendarDays
    : weeklyCalendarDays;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themePageBg }]}>
      <Header onImportSuccess={loadSummaryData} />

      {/* FLOATING CALENDAR SHIELD MODULE */}
      <View
        style={[
          styles.calendarMasterShell,
          { backgroundColor: themeCardBg, borderColor: themeBorder },
        ]}
      >
        <View style={styles.weekdayRowHeader}>
          {["M", "T", "W", "T", "F", "S", "S"].map((w, idx) => (
            <Text
              key={idx}
              style={[styles.calendarWeekdayText, { color: themeSubTextColor }]}
            >
              {w}
            </Text>
          ))}
        </View>

        <View
          style={[
            styles.calendarGridContainer,
            isMonthExpanded && styles.expandedGridGap,
          ]}
        >
          {activeCalendarDays.map((dateItem, idx) => {
            const dateKey = getLocalDateString(dateItem);
            const isSelected = getLocalDateString(selectedDate) === dateKey;
            const hasDuty = dutyMarkerMap[dateKey];
            const displayDayNum = dateItem.getDate();

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => handleCalendarDaySelection(dateItem)}
                style={[
                  styles.dayClickBox,
                  isSelected && { backgroundColor: themeAccent },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumText,
                    { color: isSelected ? "#FFFFFF" : themeTextColor },
                    dateItem.getMonth() !== currentViewMonth.getMonth() &&
                      isMonthExpanded && { opacity: 0.25 },
                  ]}
                >
                  {displayDayNum}
                </Text>

                <View style={styles.indicatorContainerSlot}>
                  {hasDuty && (
                    <FontAwesome6
                      name={hasDuty === "flight" ? "plane" : "hotel"}
                      size={7}
                      color={isSelected ? "#FFFFFF" : themeAccent}
                      style={hasDuty === "flight" && styles.calendarMiniPlane}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={[
            styles.calendarMetaFooterRow,
            { borderTopColor: themeBorder },
          ]}
        >
          <View style={styles.monthLabelGroup}>
            <Text style={[styles.monthHeaderText, { color: themeTextColor }]}>
              {currentViewMonth.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </Text>

            <View style={styles.chevronControlStack}>
              <TouchableOpacity
                onPress={() => handleNavigateCalendar("prev")}
                style={styles.chevronButton}
              >
                <FontAwesome6
                  name="chevron-left"
                  size={12}
                  color={themeSubTextColor}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleNavigateCalendar("next")}
                style={styles.chevronButton}
              >
                <FontAwesome6
                  name="chevron-right"
                  size={12}
                  color={themeSubTextColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleResetToToday}
            style={[
              styles.todayResetBtn,
              { borderColor: themeBorder, backgroundColor: themeNestedBoxBg },
            ]}
          >
            <FontAwesome6
              name="calendar"
              size={11}
              color={themeAccent}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.todayBtnText, { color: themeTextColor }]}>
              Today
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setIsMonthExpanded(!isMonthExpanded)}
          style={styles.expansionPullBar}
        >
          <View
            style={[styles.pullBarNotch, { backgroundColor: themeBorder }]}
          />
        </TouchableOpacity>
      </View>

      {/* TRIP TIMELINE LOG SCROLLVIEW */}
      <ScrollView
        ref={mainScrollRef}
        onScroll={handleScrollUpdateCalendarHighlight}
        scrollEventThrottle={16}
        style={[styles.container, { backgroundColor: themePageBg }]}
      >
        <View style={styles.contentWrapper}>
          {groupedTrips.length === 0 ? (
            <View
              style={[styles.emptyContainer, { backgroundColor: themeCardBg }]}
            >
              <FontAwesome6
                name="calendar-xmark"
                size={32}
                color={themeSubTextColor}
                style={{ marginBottom: 12 }}
              />
              <Text style={[styles.emptyText, { color: themeSubTextColor }]}>
                No flight pairings loaded yet. Tap the import icon above to
                populate your timeline records.
              </Text>
            </View>
          ) : (
            groupedTrips.map((rotation) => (
              <View
                key={rotation.tripMeta.tripNumber}
                onLayout={(event) => {
                  tripLayoutYPositions.current[rotation.tripMeta.tripNumber] =
                    event.nativeEvent.layout.y;
                }}
                style={styles.masterTripWrapper}
              >
                <View
                  style={[
                    styles.tripContainerCard,
                    { backgroundColor: themeCardBg },
                  ]}
                >
                  <View style={styles.nestedCardHeaderRow}>
                    <Text
                      style={[
                        styles.routingSummaryText,
                        { color: themeTextColor },
                      ]}
                    >
                      {rotation.routingSummary}
                    </Text>
                    <Text
                      style={[styles.lengthText, { color: themeSubTextColor }]}
                    >
                      {(() => {
                        const start = new Date(
                          `${rotation.calculatedStartDate}T12:00:00`,
                        );
                        const end = new Date(
                          `${rotation.calculatedEndDate}T12:00:00`,
                        );
                        const diffTime = Math.abs(
                          end.getTime() - start.getTime(),
                        );
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24),
                        );
                        const inclusiveDays = diffDays + 1;
                        return `${inclusiveDays} ${inclusiveDays === 1 ? "Day" : "Days"}`;
                      })()}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.nestedHeaderDividerLine,
                      { borderBottomColor: themeBorder },
                    ]}
                  />

                  {rotation.timeline.map((item, index) => {
                    const inlineHeaderDateStr = formatCardHeaderDate(
                      item.dateStr,
                    );

                    return (
                      <View key={index} style={styles.itineraryItemRow}>
                        <View style={styles.contentElementColumn}>
                          {item.type === "flight" && item.data ? (
                            <View
                              style={[
                                styles.flightBoxCard,
                                {
                                  backgroundColor: themeNestedBoxBg,
                                  borderColor: themeBorder,
                                },
                              ]}
                            >
                              <View style={styles.flightUpperRow}>
                                <View style={styles.iconCenteringFrame}>
                                  <FontAwesome6
                                    name="plane"
                                    size={13}
                                    color={themeAccent}
                                    style={styles.climbingPlaneIcon}
                                  />
                                </View>

                                <View style={styles.flightRoutingBlock}>
                                  <Text
                                    style={[
                                      styles.flightDateCardHeader,
                                      { color: themeTextColor },
                                    ]}
                                  >
                                    {inlineHeaderDateStr}
                                  </Text>

                                  <Text
                                    style={[
                                      styles.flightDetailsText,
                                      { color: themeTextColor },
                                    ]}
                                  >
                                    <Text style={styles.flightNoHighlight}>
                                      {item.data.carrier}
                                      {item.data.flightNumber}
                                    </Text>{" "}
                                    {item.data.departureStation}{" "}
                                    <Text style={styles.lightArrowText}>→</Text>{" "}
                                    {item.data.arrivalStation}
                                  </Text>

                                  <Text
                                    style={[
                                      styles.flightTimeText,
                                      { color: themeSubTextColor },
                                    ]}
                                  >
                                    {item.data.departureTimeLocal ||
                                      item.data.departureTime.split(
                                        "T",
                                      )[1]}{" "}
                                    —{" "}
                                    {item.data.arrivalTimeLocal ||
                                      item.data.arrivalTime}
                                  </Text>

                                  <Text
                                    style={[
                                      styles.flightDurationText,
                                      { color: themeSubTextColor },
                                    ]}
                                  >
                                    {formatVerbalDuration(
                                      item.data.flyingHours,
                                    )}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ) : (
                            <View
                              style={[
                                styles.layoverBoxCard,
                                { borderColor: themeBorder },
                              ]}
                            >
                              <View style={styles.iconCenteringFrame}>
                                <FontAwesome6
                                  name="hotel"
                                  size={12}
                                  color={themeAccent}
                                  style={styles.layoverIconMargin}
                                />
                              </View>
                              <View style={styles.flightRoutingBlock}>
                                <Text
                                  style={[
                                    styles.flightDateCardHeader,
                                    { color: themeTextColor },
                                  ]}
                                >
                                  {inlineHeaderDateStr}
                                </Text>
                                <Text
                                  style={[
                                    styles.layoverText,
                                    { color: themeSubTextColor },
                                  ]}
                                >
                                  Layover / Rest Day
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingTop: 14,
    width: "100%",
  },
  calendarMasterShell: {
    borderWidth: 1,
    paddingTop: 16, // ──✅ Restored clean inner card spacing layout
    paddingBottom: 4,
    paddingHorizontal: 16,
    width: SCREEN_WIDTH - 36,
    alignSelf: "center",
    borderRadius: 24,
    marginBottom: 12,
    marginTop: 105, // ──✅ Restored margin to clear the absolute logo space safely
  },
  weekdayRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  calendarWeekdayText: {
    fontFamily: "GoogleSansBold",
    fontSize: 11,
    width: 32,
    textAlign: "center",
  },
  calendarGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    width: "100%",
  },
  expandedGridGap: {
    gap: 4,
  },
  dayClickBox: {
    width: 34,
    height: 38,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dayNumText: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
  },
  indicatorContainerSlot: {
    height: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 1,
  },
  calendarMiniPlane: {
    transform: [{ rotate: "-45deg" }],
  },
  calendarMetaFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: "transparent",
  },
  monthLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "transparent",
  },
  monthHeaderText: {
    fontFamily: "GoogleSansBold",
    fontSize: 14,
  },
  chevronControlStack: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    gap: 4,
  },
  chevronButton: {
    padding: 6,
  },
  todayResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayBtnText: {
    fontFamily: "GoogleSansBold",
    fontSize: 12,
  },
  expansionPullBar: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    width: "100%",
    backgroundColor: "transparent",
  },
  pullBarNotch: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  masterTripWrapper: {
    backgroundColor: "transparent",
    marginBottom: 24,
    width: "100%",
  },
  tripContainerCard: {
    borderRadius: 20,
    padding: 14,
    width: "100%",
  },
  nestedCardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    backgroundColor: "transparent",
    paddingHorizontal: 2,
    marginBottom: 6,
    width: "100%",
  },
  nestedHeaderDividerLine: {
    borderBottomWidth: 1,
    marginBottom: 12,
    marginTop: 4,
    opacity: 0.4,
  },
  itineraryItemRow: {
    flexDirection: "row",
    backgroundColor: "transparent",
    marginVertical: 6,
    width: "100%",
  },
  routingSummaryText: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  lengthText: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    fontWeight: "400",
  },
  contentElementColumn: {
    flex: 1,
    backgroundColor: "transparent",
  },
  flightBoxCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    width: "100%",
  },
  flightUpperRow: {
    flexDirection: "row",
    backgroundColor: "transparent",
    alignItems: "flex-start",
  },
  iconCenteringFrame: {
    width: 25,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 3,
  },
  climbingPlaneIcon: {
    transform: [{ rotate: "-45deg" }],
  },
  flightRoutingBlock: {
    flex: 1,
    backgroundColor: "transparent",
    marginLeft: 4,
  },
  flightDateCardHeader: {
    fontFamily: "GoogleSansBold",
    fontSize: 15,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  flightDetailsText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    letterSpacing: -0.1,
  },
  flightNoHighlight: {
    fontFamily: "GoogleSansBold",
    color: "#007AFF",
  },
  lightArrowText: {
    fontWeight: "300",
    opacity: 0.5,
  },
  flightTimeText: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    marginTop: 3,
  },
  flightDurationText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  layoverBoxCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    backgroundColor: "transparent",
  },
  layoverIconMargin: {
    opacity: 0.7,
    paddingTop: 3,
  },
  layoverText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    width: "100%",
  },
  emptyText: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
