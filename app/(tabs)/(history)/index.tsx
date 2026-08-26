/* Change History Screen

Displays a list of roster amendments (flight and ground duty changes) for a
selected month. Data loading/hydration lives in useHistoryLogs; row chrome lives
in components/history/*; trip/ground body + pipe come from components/roster/*.

This screen orchestrates: month selection, All/Trips/Ground filter, sort order,
Local/Zulu time mode, and layout. Sort is intentionally preserved as a
History-only concern.
*/

import { FontAwesome6 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { useTimeModeZOrL } from "@/components/TimeModeZOrL";
import { GenericHistoryCard } from "@/components/history/GenericHistoryCard";
import { GroundDutyHistoryCard } from "@/components/history/GroundDutyHistoryCard";
import { HistorySortToggle } from "@/components/history/HistorySortToggle";
import { MonthPicker } from "@/components/history/MonthPicker";
import { TripHistoryCard } from "@/components/history/TripHistoryCard";
import {
  ROSTER_CARD_DARK_BG,
  ROSTER_CARD_DARK_BORDER,
  ROSTER_CARD_LIGHT_BG,
  ROSTER_CARD_LIGHT_BORDER,
} from "@/components/roster";
import { AnimatedTimeZoneToggle } from "@/components/ui/AnimatedTimeZoneToggle";
import {
  DutyTypeFilter,
  type DutyTypeFilterType,
} from "@/components/ui/DutyTypeFilter";
import { EmptyStatePanel } from "@/components/ui/EmptyStatePanel";
import { useHistoryLogs } from "@/components/useHistoryLogs";
import Colors from "@/constants/Colors";
import { HistorySortOrder, HydratedHistoryRow } from "@/db/history-types";

export default function HistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Shared across tabs (Details / History / …) via TimeModeZOrLProvider.
  const { isZulu, toggleTimeMode } = useTimeModeZOrL();

  // Default to the current month
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 16, 12, 0, 0);
  });
  const [sortOrder, setSortOrder] = useState<HistorySortOrder>("dutyDateAsc");
  const [filterType, setFilterType] = useState<DutyTypeFilterType>("TRIPS");
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>(
    {},
  );

  const { historyRows, isLoading, reload } = useHistoryLogs(selectedMonth);

  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      // Shared roster card standard (white + grey border) — same tokens Details /
      // modal / Sectors should use when they adopt RosterCardShell.
      cardBg: isDark ? ROSTER_CARD_DARK_BG : ROSTER_CARD_LIGHT_BG,
      // Match Details CalendarCard fill (translucent grey), not white roster cards.
      calendarCardBg: isDark
        ? "rgba(28, 28, 30, 0.85)"
        : "rgba(242, 242, 247, 0.85)",
      nestedBoxBg: isDark ? "#2C2C2E" : "#FFFFFF",
      border: isDark ? ROSTER_CARD_DARK_BORDER : ROSTER_CARD_LIGHT_BORDER,
      accent: "#007AFF",
      timelinePipe: "#34C759",
      localTime: isDark ? Colors.dark.localTime : Colors.light.localTime,
      // Match Details toggle colours so the pill feels identical across tabs.
      toggleBgActive: "#34C759",
      toggleBgInactive: isDark ? "#3A3A3C" : "#D1D1D6",
    }),
    [isDark],
  );

  const filteredRows = useMemo(() => {
    if (filterType === "TRIPS") {
      return historyRows.filter((row) => row.amendment.itemType === "T");
    }
    if (filterType === "GROUND") {
      return historyRows.filter((row) => row.amendment.itemType === "G");
    }
    return historyRows;
  }, [historyRows, filterType]);

  // Apply the chosen sort in-memory so flipping the toggle is instant.
  // Dates are "YYYY-MM-DD" so localeCompare orders them correctly.
  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    if (sortOrder === "dutyDateAsc") {
      return rows.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    }
    return rows.sort((a, b) =>
      b.amendment.createdAt.localeCompare(a.amendment.createdAt),
    );
  }, [filteredRows, sortOrder]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const toggleAccordion = (rowId: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const shiftMonth = (direction: "prev" | "next") => {
    const adjusted = new Date(selectedMonth);
    adjusted.setMonth(
      selectedMonth.getMonth() + (direction === "next" ? 1 : -1),
    );
    setSelectedMonth(adjusted);
  };

  const renderHistoryItem = (row: HydratedHistoryRow) => {
    switch (row.amendment.itemType) {
      case "T":
        return (
          <TripHistoryCard
            key={row.id}
            row={row}
            themeColors={themeColors}
            isExpanded={!!expandedRows[row.id]}
            onToggle={() => toggleAccordion(row.id)}
          />
        );
      case "G":
        return (
          <GroundDutyHistoryCard
            key={row.id}
            row={row}
            themeColors={themeColors}
            isExpanded={!!expandedRows[row.id]}
            onToggle={() => toggleAccordion(row.id)}
          />
        );
      default:
        return (
          <GenericHistoryCard
            key={row.id}
            row={row}
            themeColors={themeColors}
          />
        );
    }
  };

  return (
    <TabScreenLayout
      onRefresh={reload}
      // Align MonthPicker top with Details CalendarCard (marginTop: 150).
      // TabScreenLayout canvas already has marginTop: 125 → paddingTop 25.
      contentContainerStyle={styles.canvasAlignWithTripCalendar}
    >
      <MonthPicker
        selectedMonth={selectedMonth}
        themeColors={themeColors}
        onShift={shiftMonth}
      />

      {/* Match Details: All/Trips/Ground + Local↔Zulu on one row. */}
      <View style={styles.controlsRowWrapper}>
        <DutyTypeFilter
          value={filterType}
          onChange={setFilterType}
          themeColors={themeColors}
          style={styles.filterSegment}
        />

        <View style={styles.timeModeCluster}>
          <View style={styles.fixedTimezoneTextWrapper}>
            <Text
              style={[styles.timeModeLabel, { color: themeColors.textColor }]}
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

      {/* Sort (History-only) + Loads pill, right-aligned. */}
      <View style={styles.sortRow}>
        <View style={styles.sortCluster}>
          <Text style={[styles.sortLabel, { color: themeColors.textColor }]}>
            Sort
          </Text>
          <HistorySortToggle
            value={sortOrder}
            onChange={setSortOrder}
            themeColors={themeColors}
          />
        </View>

        {/* ROLLBACK: remove Loads pill (+ loadHistory* styles) if link feels wrong */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() =>
            router.push("/(tabs)/(history)/roster-load-history")
          }
          style={[
            styles.loadHistoryPill,
            {
              borderColor: themeColors.border,
              backgroundColor: themeColors.cardBg,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open roster load history"
        >
          <FontAwesome6
            name="clock-rotate-left"
            size={11}
            color={themeColors.accent}
            style={styles.loadHistoryIcon}
          />
          <Text
            style={[styles.loadHistoryText, { color: themeColors.textColor }]}
          >
            Roster Load History
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centeredState}>
          <Text
            style={{
              fontFamily: "GoogleSans",
              fontSize: 14,
              color: themeColors.subTextColor,
              marginBottom: 12,
            }}
          >
            Loading history...
          </Text>
          <ActivityIndicator size="large" color={themeColors.accent} />
        </View>
      ) : sortedRows.length === 0 ? (
        <EmptyStatePanel
          textColor={themeColors.textColor}
          subTextColor={themeColors.subTextColor}
          contentStyle={{ paddingTop: 60 }}
        />
      ) : (
        sortedRows.map((row) => renderHistoryItem(row))
      )}
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  canvasAlignWithTripCalendar: {
    paddingTop: 25,
  },
  controlsRowWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 12,
    backgroundColor: "transparent",
  },
  filterSegment: {
    flex: 1,
    marginRight: 16,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  sortCluster: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    backgroundColor: "transparent",
  },
  sortLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
    marginRight: 10,
  },
  loadHistoryPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 12,
    flexShrink: 0,
  },
  loadHistoryIcon: {
    marginRight: 6,
  },
  loadHistoryText: {
    fontFamily: "GoogleSansBold",
    fontSize: 12,
  },
  timeModeCluster: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  fixedTimezoneTextWrapper: {
    width: 42,
    alignItems: "flex-start",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  timeModeLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
  },
  centeredState: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
  },
});
