/**
 * RosterUpdatesModal
 *
 * Bottom-sheet modal for the Details (Trip) tab showing roster changes from
 * the **latest feed load** for the viewed month (same scope as the banner).
 * Full month history lives on the History tab.
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `visible` | `boolean` | controls Modal visibility |
 * | `onClose` | `() => void` | close button / Android back |
 * | `viewingMonth` | `Date` | month used for history hydration |
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Text, View } from "@/components/Themed";
import { GenericHistoryCard } from "@/components/history/GenericHistoryCard";
import { GroundDutyHistoryCard } from "@/components/history/GroundDutyHistoryCard";
import { TripHistoryCard } from "@/components/history/TripHistoryCard";
import {
  ROSTER_CARD_DARK_BG,
  ROSTER_CARD_DARK_BORDER,
  ROSTER_CARD_LIGHT_BG,
  ROSTER_CARD_LIGHT_BORDER,
} from "@/components/roster";
import { useHistoryLogs } from "@/components/useHistoryLogs";
import {
  TimelineFilterSegment,
  type TimelineFilterType,
} from "@/components/ui/TimelineFilterSegment";
import Colors from "@/constants/Colors";
import { HydratedHistoryRow } from "@/db/history-types";

interface Props {
  visible: boolean;
  onClose: () => void;
  viewingMonth: Date;
  initialFilterType: TimelineFilterType;
}

export default function RosterUpdatesModal({
  visible,
  onClose,
  viewingMonth,
  initialFilterType,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [filterType, setFilterType] =
    useState<TimelineFilterType>(initialFilterType);

  // Latest feed only — History tab shows the full month.
  const { historyRows, isLoading, reload } = useHistoryLogs(viewingMonth, {
    latestLoadOnly: true,
  });

  // Refresh whenever the tray opens or the viewed month changes.
  useEffect(() => {
    if (visible) {
      reload();
      setFilterType(initialFilterType);
    }
  }, [visible, viewingMonth, reload, initialFilterType]);

  const filteredRows = useMemo(() => {
    if (filterType === "TRIPS") {
      return historyRows.filter((row) => row.amendment.itemType === "T");
    }
    if (filterType === "GROUND") {
      return historyRows.filter((row) => row.amendment.itemType === "G");
    }
    return historyRows;
  }, [historyRows, filterType]);

  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      cardBg: isDark ? ROSTER_CARD_DARK_BG : ROSTER_CARD_LIGHT_BG,
      calendarCardBg: isDark
        ? "rgba(28, 28, 30, 0.85)"
        : "rgba(242, 242, 247, 0.85)",
      nestedBoxBg: isDark ? "#2C2C2E" : "#FFFFFF",
      border: isDark ? ROSTER_CARD_DARK_BORDER : ROSTER_CARD_LIGHT_BORDER,
      accent: "#007AFF",
      timelinePipe: "#34C759",
      localTime: isDark ? Colors.dark.localTime : Colors.light.localTime,
    }),
    [isDark],
  );

  const modalOverlay = isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.4)";
  const trayBg = isDark ? ROSTER_CARD_DARK_BG : ROSTER_CARD_LIGHT_BG;

  const renderRow = (row: HydratedHistoryRow) => {
    switch (row.amendment.itemType) {
      case "T":
        return (
          <TripHistoryCard
            key={row.id}
            row={row}
            themeColors={themeColors}
            // Flat summary only — same as collapsed History, no accordion UI.
            expandable={false}
          />
        );
      case "G":
        return (
          <GroundDutyHistoryCard
            key={row.id}
            row={row}
            themeColors={themeColors}
            // Flat summary in the modal — same as trip expandable={false}.
            expandable={false}
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: modalOverlay }]}>
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={[styles.modalTrayContent, { backgroundColor: trayBg }]}
        >
          <View style={styles.modalHeaderRow}>
            <View style={{ backgroundColor: "transparent" }}>
              <Text
                style={[styles.modalTitleText, { color: themeColors.textColor }]}
              >
                {`Changes since last load\n`}
                <Text
                  style={{
                    fontFamily: "GoogleSansBold",
                    color: themeColors.accent,
                  }}
                >
                  {viewingMonth.toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[
                styles.closeTrayButton,
                {
                  backgroundColor: themeColors.nestedBoxBg,
                  borderColor: themeColors.border,
                },
              ]}
              accessibilityLabel="Close roster updates"
            >
              <FontAwesome6
                name="xmark"
                size={14}
                color={themeColors.textColor}
              />
            </TouchableOpacity>
          </View>

          <TimelineFilterSegment
            value={filterType}
            onChange={setFilterType}
            themeColors={themeColors}
            style={styles.filterSegment}
          />

          {isLoading ? (
            <View style={styles.centeredLoadingState}>
              <ActivityIndicator size="large" color={themeColors.accent} />
            </View>
          ) : (
            <FlatList
              data={filteredRows}
              keyExtractor={(item) => item.id}
              style={styles.modalItemsScrollList}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => renderRow(item)}
              ListEmptyComponent={
                <View style={styles.emptyComponentBlock}>
                  <Text
                    style={{
                      fontFamily: "GoogleSans",
                      color: themeColors.subTextColor,
                      fontSize: 14,
                    }}
                  >
                    {historyRows.length === 0
                      ? "No changes from the latest roster load for this month."
                      : "No items match this filter category."}
                  </Text>
                </View>
              }
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalTrayContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    height: "75%",
    width: "100%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "transparent",
    paddingBottom: 20,
  },
  modalTitleText: {
    fontFamily: "GoogleSansBold",
    fontSize: 20,
    letterSpacing: -0.4,
  },
  closeTrayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterSegment: {
    marginBottom: 12,
    flexGrow: 0,
    flexShrink: 0,
  },
  modalItemsScrollList: { flex: 1 },
  centeredLoadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyComponentBlock: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 12,
  },
});
