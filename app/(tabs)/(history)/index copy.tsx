/* Change History Screen

Displays a list of roster amendments (flight and ground duty changes) for a
selected month. Data loading/hydration lives in useHistoryLogs; the individual
rows are rendered by the presentational components in components/history/*.
This screen only orchestrates: month selection, sort order, and layout.

TODO: possible filter on duty types, eg Trip, Ground, All etc.
TODO: possibly combine into a roster maintenance screen combined with roster loading capabilities
 */

import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, useColorScheme } from "react-native";

import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { GenericHistoryCard } from "@/components/history/GenericHistoryCard";
import { GroundDutyHistoryCard } from "@/components/history/GroundDutyHistoryCard";
import { HistorySortToggle } from "@/components/history/HistorySortToggle";
import { MonthPicker } from "@/components/history/MonthPicker";
import { TripHistoryCard } from "@/components/history/TripHistoryCard";
import { useHistoryLogs } from "@/components/useHistoryLogs";
import { HistorySortOrder, HydratedHistoryRow } from "@/db/history-types";

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Default to the current month
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 16, 12, 0, 0);
  });
  const [sortOrder, setSortOrder] = useState<HistorySortOrder>("dutyDateAsc");
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>(
    {},
  );

  const { historyRows, isLoading, reload } = useHistoryLogs(selectedMonth);

  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      cardBg: isDark ? "#1C1C1E" : "#F2F2F7",
      nestedBoxBg: isDark ? "#2C2C2E" : "#FFFFFF",
      border: isDark ? "rgba(56, 56, 58, 0.4)" : "rgba(229, 229, 234, 0.6)",
      accent: "#007AFF",
      timelinePipe: "#34C759",
    }),
    [isDark],
  );

  // Apply the chosen sort in-memory so flipping the toggle is instant.
  // Dates are "YYYY-MM-DD" so localeCompare orders them correctly.
  const sortedRows = useMemo(() => {
    const rows = [...historyRows];
    if (sortOrder === "dutyDateAsc") {
      return rows.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    }
    return rows.sort((a, b) =>
      b.amendment.createdAt.localeCompare(a.amendment.createdAt),
    );
  }, [historyRows, sortOrder]);

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
          />
        );
      default:
        return (
          <GenericHistoryCard key={row.id} row={row} themeColors={themeColors} />
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

      <View style={styles.sortRow}>
        <Text style={[styles.sortLabel, { color: themeColors.subTextColor }]}>
          Sort
        </Text>
        <HistorySortToggle
          value={sortOrder}
          onChange={setSortOrder}
          themeColors={themeColors}
        />
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
        <View style={styles.emptyContainer}>
          <Text style={{ textAlign: "center" }}>
            No roster changes are recorded for this monthly calendar block.
          </Text>
        </View>
      ) : (
        sortedRows.map((row) => renderHistoryItem(row))
      )}
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 12,
    marginBottom: 20,
  },
  sortLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
  },
  centeredState: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
});
