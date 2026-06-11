import { Text, View } from "@/components/Themed";
import React from "react";
import { StyleSheet } from "react-native";
import DutyItemRow from "./DutyItemRow";

interface ItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  data?: any;
}

interface GroupedTripRotation {
  routingSummary: string;
  calculatedStartDate: string;
  calculatedEndDate: string;
  timeline: ItineraryItem[];
}

interface TripDetailsCardProps {
  rotation: GroupedTripRotation;
  themeColors: {
    cardBg: string;
    textColor: string;
    subTextColor: string;
    border: string;
    nestedBoxBg: string;
    accent: string;
  };
  onLayout: (event: any) => void;
  formatCardHeaderDate: (dateStr: string) => string;
  formatVerbalDuration: (isoDuration: string | null) => string;
}

export default function TripDetailsCard({
  rotation,
  themeColors,
  onLayout,
  formatCardHeaderDate,
  formatVerbalDuration,
}: TripDetailsCardProps) {
  return (
    <View onLayout={onLayout} style={styles.masterTripWrapper}>
      <View
        style={[
          styles.tripContainerCard,
          { backgroundColor: themeColors.cardBg },
        ]}
      >
        <View style={styles.nestedCardHeaderRow}>
          <Text
            style={[
              styles.routingSummaryText,
              { color: themeColors.textColor },
            ]}
          >
            {rotation.routingSummary}
          </Text>
          <Text
            style={[styles.lengthText, { color: themeColors.subTextColor }]}
          >
            {(() => {
              const start = new Date(
                `${rotation.calculatedStartDate}T12:00:00`,
              );
              const end = new Date(`${rotation.calculatedEndDate}T12:00:00`);
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const inclusiveDays = diffDays + 1;
              return `${inclusiveDays} ${inclusiveDays === 1 ? "Day" : "Days"}`;
            })()}
          </Text>
        </View>

        <View
          style={[
            styles.nestedHeaderDividerLine,
            { borderBottomColor: themeColors.border },
          ]}
        />

        {rotation.timeline.map((item, index) => (
          <DutyItemRow
            key={index}
            item={item}
            themeColors={themeColors}
            formatCardHeaderDate={formatCardHeaderDate}
            formatVerbalDuration={formatVerbalDuration}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  routingSummaryText: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  lengthText: {
    fontFamily: "GoogleSans",
    fontSize: 12,
    fontWeight: "400",
  },
  nestedHeaderDividerLine: {
    borderBottomWidth: 1,
    marginBottom: 12,
    marginTop: 4,
    opacity: 0.4,
  },
});
