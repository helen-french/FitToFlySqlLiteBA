import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";

import { Text, View } from "@/components/Themed";
import { cardStyles as styles } from "@/components/history/historyStyles";
import { formatDisplayDate } from "@/components/history/historyUtils";
import { HistoryThemeColors, HydratedHistoryRow } from "@/db/history-types";

interface Props {
  row: HydratedHistoryRow;
  themeColors: HistoryThemeColors;
}

export function GroundDutyHistoryCard({ row, themeColors }: Props) {
  const gdStart = row.groundDutyData?.startDateStr;
  const gdEnd = row.groundDutyData?.endDateStr;
  // Show a date range only when the end date is later than the start date,
  // otherwise just show the single start date.
  const groundDateLabel = gdStart
    ? gdEnd && gdEnd > gdStart
      ? `${formatDisplayDate(gdStart)} — ${formatDisplayDate(gdEnd)}`
      : formatDisplayDate(gdStart)
    : row.amendment.details?.match(/\d{4}-\d{2}-\d{2}/)?.[0]
      ? formatDisplayDate(row.amendment.details.match(/\d{4}-\d{2}-\d{2}/)![0])
      : null;

  return (
    <View
      style={[
        styles.historyCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.border,
        },
      ]}
    >
      <View style={styles.badgeMetadataRow}>
        <View style={[styles.badgePill, { backgroundColor: row.badgeColor }]}>
          <Text style={styles.badgeText}>{row.badgeLabel}</Text>
        </View>
        {!!row.captureDate && (
          <Text style={[styles.metaText, { color: themeColors.subTextColor }]}>
            Sync Date: {row.captureDate}
          </Text>
        )}
      </View>

      {groundDateLabel && (
        <Text
          style={{
            fontFamily: "GoogleSansBold",
            fontSize: 13,
            color: themeColors.textColor,
            marginBottom: 2,
            marginTop: 4,
          }}
        >
          {groundDateLabel}
        </Text>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 4,
          backgroundColor: "transparent",
        }}
      >
        <FontAwesome6
          name="plane-slash"
          size={13}
          color={row.badgeColor}
          style={{ marginRight: 8 }}
        />
        <Text
          style={[
            styles.genericDetailsText,
            {
              color: themeColors.textColor,
              fontFamily: "GoogleSansBold",
              fontSize: 16,
            },
          ]}
        >
          Ground Duty{" "}
          {row.amendment.identifier ? `: ${row.amendment.identifier}` : ""}
        </Text>
      </View>
    </View>
  );
}
