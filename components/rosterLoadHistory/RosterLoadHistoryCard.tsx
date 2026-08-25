/**
 * Accordion card for one data_load row — Trip-list visual language.
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

import { Text, View } from "@/components/Themed";
import {
  ROSTER_CARD_DARK_BG,
  ROSTER_CARD_DARK_BORDER,
  ROSTER_CARD_LIGHT_BG,
  ROSTER_CARD_LIGHT_BORDER,
  RosterCardShell,
} from "@/components/roster";
import type { DataLoad } from "@/db/schema";
import {
  formatFeedStamp,
  formatFriendlyDateTime,
  formatRosterMonthLabel,
} from "./formatRosterLoadHistory";

type Theme = {
  isDark: boolean;
  textColor: string;
  subTextColor: string;
  accent: string;
  chipBg: string;
};

type Props = {
  row: DataLoad;
  theme: Theme;
  isExpanded: boolean;
  onToggle: () => void;
};

function DetailLine({
  label,
  value,
  textColor,
  subTextColor,
}: {
  label: string;
  value: string;
  textColor: string;
  subTextColor: string;
}) {
  if (!value) return null;
  return (
    <Text style={[styles.detailLine, { color: subTextColor }]}>
      <Text style={[styles.detailLabel, { color: textColor }]}>{label}: </Text>
      {value}
    </Text>
  );
}

export function RosterLoadHistoryCard({
  row,
  theme,
  isExpanded,
  onToggle,
}: Props) {
  const cardTheme = {
    cardBg: theme.isDark ? ROSTER_CARD_DARK_BG : ROSTER_CARD_LIGHT_BG,
    border: theme.isDark ? ROSTER_CARD_DARK_BORDER : ROSTER_CARD_LIGHT_BORDER,
  };

  const feedCreated = formatFeedStamp(
    row.rosterDateOfCreation || "",
    row.rosterTimeOfCreation || "",
  );
  const loadedAt = formatFriendlyDateTime(row.createdAt);
  const monthLabel = formatRosterMonthLabel(row.rosterMonthNumber || "");

  return (
    <RosterCardShell themeColors={cardTheme} style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${isExpanded ? "Collapse" : "Expand"} ${monthLabel}`}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text
              style={[styles.primary, { color: theme.textColor }]}
              numberOfLines={1}
            >
              {monthLabel}
            </Text>
            <Text
              style={[styles.secondary, { color: theme.subTextColor }]}
              numberOfLines={1}
            >
              Created: {feedCreated}
            </Text>
            <Text
              style={[styles.secondary, { color: theme.subTextColor }]}
              numberOfLines={1}
            >
              Loaded: {loadedAt}
            </Text>
          </View>
          <FontAwesome6
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={theme.subTextColor}
          />
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <Animated.View
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(150)}
          style={[
            styles.body,
            {
              backgroundColor: "transparent",
              borderColor: theme.isDark
                ? "rgba(72, 72, 74, 0.75)"
                : "#D1D1D6",
            },
          ]}
        >
          <Text style={[styles.bodyTitle, { color: theme.textColor }]}>
            Feed Details
          </Text>
          <DetailLine
            label="Roster Filename"
            value={row.rosterFileName || ""}
            textColor={theme.textColor}
            subTextColor={theme.subTextColor}
          />
          <DetailLine
            label="Roster Created"
            value={feedCreated}
            textColor={theme.textColor}
            subTextColor={theme.subTextColor}
          />
          <DetailLine
            label="Trip Filename"
            value={row.tripFileName || ""}
            textColor={theme.textColor}
            subTextColor={theme.subTextColor}
          />
          <DetailLine
            label="Trip Created"
            value={formatFeedStamp(
              row.tripDateOfCreation || "",
              row.tripTimeOfCreation || "",
            )}
            textColor={theme.textColor}
            subTextColor={theme.subTextColor}
          />
          <DetailLine
            label="Period"
            value={
              row.rosterStartDateOfFeed && row.rosterEndDateOfFeed
                ? `${row.rosterStartDateOfFeed} → ${row.rosterEndDateOfFeed}`
                : ""
            }
            textColor={theme.textColor}
            subTextColor={theme.subTextColor}
          />
        </Animated.View>
      ) : null}
    </RosterCardShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  headerText: {
    flex: 1,
    backgroundColor: "transparent",
    marginRight: 10,
  },
  primary: {
    fontFamily: "GoogleSansBold",
    fontSize: 15,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  secondary: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    marginTop: 2,
  },
  body: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  bodyTitle: {
    fontFamily: "GoogleSansBold",
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  detailLine: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
  detailLabel: {
    fontFamily: "GoogleSansBold",
  },
});
