/* Change History Screen

Displays a list of roster amendments (flight and ground duty changes) for a
selected month. Data loading/hydration lives in useHistoryLogs; row chrome lives
in components/history/*; trip/ground body + pipe come from components/roster/*.

This screen orchestrates: month selection, All/Trips/Ground filter, sort order,
Local/Zulu time mode, and layout. Sort is intentionally preserved as a
History-only concern.
*/

import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, useColorScheme } from "react-native";

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
    <TabScreenLayout onRefresh={reload}>
      <MonthPicker
        selectedMonth={selectedMonth}
        themeColors={themeColors}
        onShift={shiftMonth}
      />

      <DutyTypeFilter
        value={filterType}
        onChange={setFilterType}
        themeColors={themeColors}
        style={styles.filterSegment}
      />

      {/* Sort stays History-only; Local/Zulu mirrors the Details control. */}
      <View style={styles.controlsRow}>
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

        <View style={styles.timeModeCluster}>
          <Text
            style={[styles.timeModeLabel, { color: themeColors.textColor }]}
          >
            {isZulu ? "Zulu" : "Local"}
          </Text>
          <AnimatedTimeZoneToggle
            isZulu={isZulu}
            onToggle={toggleTimeMode}
            activeBg={themeColors.toggleBgActive}
            inactiveBg={themeColors.toggleBgInactive}
          />
        </View>
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
  filterSegment: {
    marginTop: 12,
    width: "100%",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 12,
    marginBottom: 20,
  },
  sortCluster: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  sortLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
    marginRight: 10,
  },
  timeModeCluster: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  timeModeLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
    marginRight: 8,
  },
  centeredState: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
  },
});
