/**
 * Roster screen
 *
 * Calendar + chronological list of trips and ground duties. This file owns
 * **orchestration only**: calendar sync, filters, expand state, FlatList.
 * DB hydration lives in `useDetailsTimeline` (same pattern as History +
 * `useHistoryLogs`). Visual cards wrap shared `components/roster/*`.
 *
 * ## File map
 *
 * | File | Role |
 * | --- | --- |
 * | `index.tsx` (this) | Calendar, filters, expand, FlatList |
 * | `useDetailsTimeline` | DB → `UnifiedTimelineRow[]` |
 * | `components/roster/RosterTripCard.tsx` | Trip accordion + sector chevron → Sectors |
 * | `components/roster/RosterGroundCard.tsx` | Ground accordion |
 * | `components/roster/mapDetailsToRosterVM.ts` | Details payload → shared roster VMs |
 * | `components/modals/RosterUpdatesModal.tsx` | Latest-load amendments tray |
 *
 * ## Data flow
 *
 * 1. `useDetailsTimeline().reload` hydrates active roster → `timelineRows`
 * 2. FlatList renders via `RosterTripCard` / `RosterGroundCard`
 * 3. Cards map via `mapDetailsToRosterVM` → shared roster presentational pieces
 *
 * Local/Zulu labels & greens: cards use `useFlightTimeFormatter` + `Colors.localTime`.
 */

import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/Header";
import RosterAmendmentBanner from "@/components/RosterAmendmentBanner";
import { Text, View } from "@/components/Themed";
import { useTimeModeZOrL } from "@/components/TimeModeZOrL";
import {
  ROSTER_CARD_DARK_BG,
  ROSTER_CARD_DARK_BORDER,
  ROSTER_CARD_LIGHT_BG,
  ROSTER_CARD_LIGHT_BORDER,
  RosterGroundCard,
  RosterTripCard,
} from "@/components/roster";
import CalendarCard from "@/components/summary/CalendarCard";
import { AnimatedTimeZoneToggle } from "@/components/ui/AnimatedTimeZoneToggle";
import {
  DutyTypeFilter,
  type DutyTypeFilterType,
} from "@/components/ui/DutyTypeFilter";
import { EmptyStatePanel } from "@/components/ui/EmptyStatePanel";
import SkyHeader from "@/components/ui/SkyHeader";
import { useAmendments } from "@/components/useAmendments";
import { useDetailsTimeline } from "@/components/useDetailsTimeline";
import Colors from "@/constants/Colors";
import { UnifiedTimelineRow } from "@/db/details-types";
import { startOfTodayLocal } from "@/lib/utils";

import RosterUpdatesModal from "@/components/modals/RosterUpdatesModal";

export default function RosterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  // Shared across tabs via TimeModeZOrLProvider. Card formatting lives in
  // RosterTripCard / RosterGroundCard.
  const { isZulu, toggleTimeMode } = useTimeModeZOrL();

  // TODO: extract shared themeColors builder (duplicated on History / Roster / Sectors).
  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      pageBg: isDark ? "#000000" : "#FFFFFF",
      calendarCardBg: isDark
        ? "rgba(28, 28, 30, 0.85)"
        : "rgba(242, 242, 247, 0.85)",
      // Shared roster card standard (white + grey border).
      cardBg: isDark ? ROSTER_CARD_DARK_BG : ROSTER_CARD_LIGHT_BG,
      nestedBoxBg: isDark ? "#3A3A3C" : "#FFFFFF",
      border: isDark ? ROSTER_CARD_DARK_BORDER : ROSTER_CARD_LIGHT_BORDER,
      accent: "#007AFF",
      timelinePipe: "#34C759",
      localTime: isDark ? Colors.dark.localTime : Colors.light.localTime,
      toggleBgActive: "#34C759",
      toggleBgInactive: isDark ? "#3A3A3C" : "#D1D1D6",
      toggleActivePill: isDark ? "#48484A" : "#FFFFFF",
    }),
    [isDark],
  );

  // DB hydration — parallel to History’s useHistoryLogs.
  const { timelineRows, isLoading, reload } = useDetailsTimeline();
  const [filterType, setFilterType] = useState<DutyTypeFilterType>("TRIPS");

  // Accordion expand maps — keyed by tripNumber (T) or UnifiedTimelineRow.id (G).
  const [expandedTrips, setExpandedTrips] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedGroundDuties, setExpandedGroundDuties] = useState<{
    [key: string]: boolean;
  }>({});

  // Calendar + list anchor to the device’s current local date.
  const [selectedDate, setSelectedDate] = useState<Date>(startOfTodayLocal);
  const [currentViewMonth, setCurrentViewMonth] = useState<Date>(startOfTodayLocal);
  const [isMonthExpanded, setIsMonthExpanded] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  // Banner still needs the month-scoped amendment count; modal hydrates via useHistoryLogs.
  const { refreshAmendments } = useAmendments(currentViewMonth);

  // Reload timeline + amendment banner (import success / tab focus).
  const reloadAll = useCallback(async () => {
    await reload();
    refreshAmendments();
  }, [reload, refreshAmendments]);

  // Calendar ↔ list sync: list scroll updates calendar; day tap scrolls list.
  // `isAutoScrolling` blocks viewability from fighting a programmatic scroll.
  const flatListRef = useRef<FlatList<UnifiedTimelineRow>>(null);
  const isAutoScrolling = useRef<boolean>(false);
  const hasInitiallySynced = useRef<boolean>(false);
  const filteredTimelineRowsRef = useRef<UnifiedTimelineRow[]>([]);

  const safeScrollToIndex = useCallback((requestedIndex: number) => {
    const rows = filteredTimelineRowsRef.current;
    if (!flatListRef.current || rows.length === 0) return;

    const clampedIndex = Math.max(
      0,
      Math.min(requestedIndex, rows.length - 1),
    );

    isAutoScrolling.current = true;
    try {
      flatListRef.current.scrollToIndex({
        index: clampedIndex,
        animated: true,
        viewPosition: 0,
      });
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 450);
    } catch {
      isAutoScrolling.current = false;
    }
  }, []);

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      const rows = filteredTimelineRowsRef.current;
      if (!flatListRef.current || rows.length === 0) return;

      const clampedIndex = Math.max(0, Math.min(info.index, rows.length - 1));

      // Prime layout with an approximate offset, then retry with a clamped index.
      flatListRef.current.scrollToOffset({
        offset: Math.max(0, info.averageItemLength * clampedIndex),
        animated: false,
      });

      setTimeout(() => {
        safeScrollToIndex(clampedIndex);
      }, 100);
    },
    [safeScrollToIndex],
  );

  /** ALL / Trips / Ground segment control — filters the FlatList only. */
  const filteredTimelineRows = useMemo(() => {
    if (filterType === "TRIPS")
      return timelineRows.filter((row) => row.type === "T");
    if (filterType === "GROUND")
      return timelineRows.filter((row) => row.type === "G");
    return timelineRows;
  }, [timelineRows, filterType]);
  filteredTimelineRowsRef.current = filteredTimelineRows;

  const toggleTripAccordion = (tripNumber: string) => {
    setExpandedTrips((prev) => ({ ...prev, [tripNumber]: !prev[tripNumber] }));
  };

  const toggleGroundAccordion = (rowId: string) => {
    setExpandedGroundDuties((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  /** YYYY-MM-DD in the device’s local calendar (avoids UTC-only ISO surprises). */
  const getLocalDateString = useCallback((date: Date): string => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().split("T")[0];
  }, []);

  /**
   * Scroll FlatList so the first row covering `targetDate` is at the top.
   * Trips match if the date falls inside calculatedStart–End; ground matches startDate.
   */
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

      if (finalIndex !== -1) {
        safeScrollToIndex(finalIndex);
      }
    },
    [filteredTimelineRows, getLocalDateString, safeScrollToIndex],
  );

  /**
   * When the user scrolls the list, mirror the top visible row onto the calendar.
   * Skipped while `isAutoScrolling` so day-tap / initial sync don’t thrash state.
   */
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

  // Reload whenever this tab gains focus (e.g. after import / returning from Settings).
  useFocusEffect(
    useCallback(() => {
      reloadAll();
    }, [reloadAll]),
  );

  // Re-scroll after filter changes once data is already loaded.
  useEffect(() => {
    if (!isLoading && filteredTimelineRows.length > 0) {
      const timer = setTimeout(() => {
        scrollToDateInList(selectedDate);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isLoading, filterType, scrollToDateInList, selectedDate]);

  // One-shot: land the list on today after the first successful load.
  useEffect(() => {
    if (
      !isLoading &&
      filteredTimelineRows.length > 0 &&
      !hasInitiallySynced.current
    ) {
      const timer = setTimeout(() => {
        scrollToDateInList(startOfTodayLocal());
        hasInitiallySynced.current = true;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, filteredTimelineRows, scrollToDateInList]);

  /**
   * Calendar day dots: flight days (incl. multi-day layover span) vs ground.
   * Walks trip timelines so every intermediate date gets a “flight” marker.
   */
  const dutyMarkerMap = useMemo(() => {
    const map: { [dateKey: string]: "flight" | "layover" | "ground" } = {};
    timelineRows.forEach((row) => {
      if (row.type === "T" && row.tripData) {
        row.tripData.timeline.forEach((item) => {
          map[item.dateStr] = "flight";
          if (item.endDateStr) {
            let currentCursor = new Date(`${item.dateStr}T12:00:00`);
            const finalCursor = new Date(`${item.endDateStr}T12:00:00`);
            while (currentCursor <= finalCursor) {
              const k = currentCursor.toISOString().split("T")[0];
              map[k] = "flight";
              currentCursor.setDate(currentCursor.getDate() + 1);
            }
          }
        });
      } else if (row.type === "G") {
        map[row.startDate] = "ground";
      }
    });
    return map;
  }, [timelineRows]);

  // Week strip (Mon–Sun around currentViewMonth) vs 5-week month grid.
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

  /**
   * FlatList row renderer. Presentation only — DB shape stays here;
   * RosterTripCard / RosterGroundCard map into shared roster VMs.
   */
  const renderTimelineItem = useCallback(
    ({ item }: { item: UnifiedTimelineRow }) => {
      if (item.type === "T" && item.tripData) {
        const rotation = item.tripData;
        const tripNumber = rotation.tripMeta.tripNumber;
        return (
          <RosterTripCard
            tripData={rotation}
            themeColors={themeColors}
            isExpanded={!!expandedTrips[tripNumber]}
            onToggle={() => toggleTripAccordion(tripNumber)}
            // Sector chevron → Trip tab (History does not pass this).
            onPressSector={(params) =>
              router.push({
                pathname: "/(tabs)/(sectors)",
                params: {
                  tripNumber: params.tripNumber,
                  startDate: params.startDate,
                  endDate: params.endDate,
                  routing: params.routing,
                } as Record<string, string>,
              })
            }
          />
        );
      }

      if (item.type === "G" && item.groundData) {
        return (
          <RosterGroundCard
            groundData={item.groundData}
            themeColors={themeColors}
            isExpanded={!!expandedGroundDuties[item.id]}
            onToggle={() => toggleGroundAccordion(item.id)}
          />
        );
      }
      return null;
    },
    [expandedTrips, expandedGroundDuties, themeColors, router],
  );

  // ── Render hierarchy ───────────────────────────────────────────────────────
  // SkyHeader → Header → CalendarCard → amendment banner → filter/L-Z → list → modal
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.pageBg }]}
    >
      <SkyHeader
        height={190}
        showClouds={true}
        style={styles.absoluteSkyPosition}
      />
      <Header onImportSuccess={reloadAll} />

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
          setTimeout(() => scrollToDateInList(newDate), 50);
        }}
        onResetToday={() => {
          const today = startOfTodayLocal();
          setSelectedDate(today);
          setCurrentViewMonth(today);
          scrollToDateInList(today);
        }}
        onToggleExpand={() => setIsMonthExpanded(!isMonthExpanded)}
      />

      {/* Opens RosterUpdatesModal — History-style cards for the viewed month. */}
      <RosterAmendmentBanner
        viewingDate={currentViewMonth}
        onPress={() => setIsModalOpen(true)}
      />

      {/* ALL / Trips / Ground + Local↔Zulu toggle */}
      <View style={styles.controlsRowWrapper}>
        <DutyTypeFilter
          value={filterType}
          onChange={setFilterType}
          themeColors={themeColors}
          style={styles.filterSegment}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
          }}
        >
          <View style={styles.fixedTimezoneTextWrapper}>
            <Text
              style={{
                fontFamily: "GoogleSansBold",
                fontSize: 13,
                color: themeColors.textColor,
              }}
            ></Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "transparent",
            }}
          >
            <View style={styles.fixedTimezoneTextWrapper}>
              <Text
                style={{
                  fontFamily: "GoogleSansBold",
                  fontSize: 13,
                  color: themeColors.textColor,
                }}
              >
                {isZulu ? "Zulu" : "Local"}
              </Text>
            </View>

            <AnimatedTimeZoneToggle
              isZulu={isZulu}
              onToggle={toggleTimeMode}
              activeBg={themeColors.toggleBgActive}
              inactiveBg={themeColors.toggleBgInactive}
            />
          </View>
        </View>
      </View>

      {/* Chronological trip / ground list — synced with calendar via refs above. */}
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
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        ListEmptyComponent={
          <EmptyStatePanel
            textColor={themeColors.textColor}
            subTextColor={themeColors.subTextColor}
            contentStyle={{ paddingTop: 60 }}
          />
        }
      />

      <RosterUpdatesModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewingMonth={currentViewMonth}
        initialFilterType={filterType}
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

  controlsRowWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  filterSegment: {
    flex: 1,
    marginRight: 16,
  },

  fixedTimezoneTextWrapper: {
    width: 42,
    alignItems: "flex-start",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
