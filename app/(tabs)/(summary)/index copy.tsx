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
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/Header";
import { Text, View } from "@/components/Themed";

import CalendarCard from "@/components/summary/CalendarCard";
import TripDetailsCard from "@/components/summary/TripDetailsCard";

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

export default function SummaryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      pageBg: isDark ? "#000000" : "#FFFFFF",
      cardBg: isDark ? "#1C1C1E" : "#F2F2F7",
      nestedBoxBg: isDark ? "#2C2C2E" : "#FFFFFF",
      border: isDark ? "#38383A" : "#E5E5EA",
      accent: "#007AFF",
    }),
    [isDark],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [groupedTrips, setGroupedTrips] = useState<GroupedTripRotation[]>([]);

  const initialToday = useMemo(() => new Date("2026-06-08"), []);
  const [selectedDate, setSelectedDate] = useState<Date>(initialToday);
  const [currentViewMonth, setCurrentViewMonth] = useState<Date>(initialToday);
  const [isMonthExpanded, setIsMonthExpanded] = useState<boolean>(false);

  const mainScrollRef = useRef<ScrollView>(null);
  const tripLayoutYPositions = useRef<{ [key: string]: number }>({});
  const isAutoScrolling = useRef<boolean>(false);
  const hasInitiallySynced = useRef<boolean>(false);

  const getLocalDateString = useCallback((date: Date): string => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().split("T")[0];
  }, []);

  const formatVerbalDuration = useCallback((isoDuration: string | null) => {
    if (!isoDuration) return "0 hours 0 minutes";
    const raw = isoDuration.replace("PT", "");
    const parts = raw.split("H");
    let hours = parseInt(parts[0], 10) || 0;
    let minutes =
      parts.length > 1 ? parseInt(parts[1].replace("M", ""), 10) || 0 : 0;
    return `${hours} ${hours === 1 ? "hour" : "hours"} ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
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
          .select()
          .from(sectors)
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
      console.error("Summary load failure:", err);
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

  const scrollToDateInList = useCallback(
    (targetDate: Date) => {
      if (groupedTrips.length === 0) return;
      const dateKey = getLocalDateString(targetDate);
      const matched =
        groupedTrips.find(
          (rot) =>
            dateKey >= rot.calculatedStartDate &&
            dateKey <= rot.calculatedEndDate,
        ) || groupedTrips.find((rot) => rot.calculatedStartDate >= dateKey);

      if (matched && mainScrollRef.current) {
        const targetY =
          tripLayoutYPositions.current[matched.tripMeta.tripNumber];
        if (typeof targetY === "number") {
          isAutoScrolling.current = true;
          mainScrollRef.current.scrollTo({ y: targetY, animated: true });
          setTimeout(() => {
            isAutoScrolling.current = false;
          }, 450);
        }
      }
    },
    [groupedTrips, getLocalDateString],
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

  const handleScrollUpdateCalendarHighlight = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isAutoScrolling.current || groupedTrips.length === 0) return;
    const scrollY = event.nativeEvent.contentOffset.y;
    let visibleTripId = groupedTrips[0].tripMeta.tripNumber;

    for (const rotation of groupedTrips) {
      if (
        scrollY >=
        (tripLayoutYPositions.current[rotation.tripMeta.tripNumber] || 0) - 30
      ) {
        visibleTripId = rotation.tripMeta.tripNumber;
      }
    }

    const visible = groupedTrips.find(
      (r) => r.tripMeta.tripNumber === visibleTripId,
    );
    if (visible) {
      const activeSelectedKey = getLocalDateString(selectedDate);
      if (
        activeSelectedKey >= visible.calculatedStartDate &&
        activeSelectedKey <= visible.calculatedEndDate
      )
        return;
      const tripDateObj = new Date(`${visible.calculatedStartDate}T12:00:00`);
      if (!isNaN(tripDateObj.getTime())) {
        setSelectedDate(tripDateObj);
        setCurrentViewMonth(tripDateObj);
      }
    }
  };

  const handleNavigateCalendar = (direction: "prev" | "next") => {
    const newDate = new Date(currentViewMonth);
    if (isMonthExpanded)
      newDate.setMonth(
        currentViewMonth.getMonth() + (direction === "next" ? 1 : -1),
      );
    else
      newDate.setDate(
        currentViewMonth.getDate() + (direction === "next" ? 7 : -7),
      );
    setCurrentViewMonth(newDate);
  };

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
      <Header onImportSuccess={loadSummaryData} />

      <CalendarCard
        activeCalendarDays={activeCalendarDays}
        selectedDate={selectedDate}
        currentViewMonth={currentViewMonth}
        isMonthExpanded={isMonthExpanded}
        dutyMarkerMap={dutyMarkerMap}
        themeColors={themeColors}
        getLocalDateString={getLocalDateString}
        onDaySelect={(handleDaySelection) => {
          setSelectedDate(handleDaySelection);
          setCurrentViewMonth(handleDaySelection);
          scrollToDateInList(handleDaySelection);
        }}
        onNavigate={handleNavigateCalendar}
        onResetToday={() => {
          setSelectedDate(initialToday);
          setCurrentViewMonth(initialToday);
          scrollToDateInList(initialToday);
        }}
        onToggleExpand={() => setIsMonthExpanded(!isMonthExpanded)}
      />

      <ScrollView
        ref={mainScrollRef}
        onScroll={handleScrollUpdateCalendarHighlight}
        scrollEventThrottle={16}
        style={[styles.container, { backgroundColor: themeColors.pageBg }]}
      >
        <View style={styles.contentWrapper}>
          {groupedTrips.length === 0 ? (
            <View
              style={[
                styles.emptyContainer,
                { backgroundColor: themeColors.cardBg },
              ]}
            >
              <FontAwesome6
                name="calendar-xmark"
                size={32}
                color={themeColors.subTextColor}
                style={{ marginBottom: 12 }}
              />
              <Text
                style={{
                  fontFamily: "GoogleSans",
                  fontSize: 13,
                  textAlign: "center",
                  color: themeColors.subTextColor,
                }}
              >
                No flight pairings loaded yet.
              </Text>
            </View>
          ) : (
            groupedTrips.map((rotation) => (
              <TripDetailsCard
                key={rotation.tripMeta.tripNumber}
                rotation={rotation}
                themeColors={themeColors}
                onLayout={(event) => {
                  tripLayoutYPositions.current[rotation.tripMeta.tripNumber] =
                    event.nativeEvent.layout.y;
                }}
                formatCardHeaderDate={formatCardHeaderDate}
                formatVerbalDuration={formatVerbalDuration}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  contentWrapper: { paddingHorizontal: 20, paddingTop: 14, width: "100%" },
  emptyContainer: {
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    width: "100%",
  },
});
