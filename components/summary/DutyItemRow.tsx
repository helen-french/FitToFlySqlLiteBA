import { Text, View } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet } from "react-native";
import { Sector } from "../../db/schema";

interface ItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  data?: Sector & { actualReportTime?: string | null }; // ──✅ Added fallback key safety
}

interface DutyItemRowProps {
  item: ItineraryItem;
  themeColors: {
    textColor: string;
    subTextColor: string;
    nestedBoxBg: string;
    border: string;
    accent: string;
  };
  formatCardHeaderDate: (dateStr: string) => string;
  formatVerbalDuration: (isoDuration: string | null) => string;
}

export default function DutyItemRow({
  item,
  themeColors,
  formatCardHeaderDate,
  formatVerbalDuration,
}: DutyItemRowProps) {
  const inlineHeaderDateStr = formatCardHeaderDate(item.dateStr);

  return (
    <View style={styles.itineraryItemRow}>
      <View style={styles.contentElementColumn}>
        {item.type === "flight" && item.data ? (
          <View
            style={[
              styles.flightBoxCard,
              {
                backgroundColor: themeColors.nestedBoxBg,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.flightUpperRow}>
              <View style={styles.iconCenteringFrame}>
                <FontAwesome6
                  name="plane"
                  size={13}
                  color={themeColors.accent}
                  style={styles.climbingPlaneIcon}
                />
              </View>

              <View style={styles.flightRoutingBlock}>
                {/* ──✅ UPDATE 1: ADD REPORT TIME IN PALE GREY RIGHT BESIDE THE DATE */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                    backgroundColor: "transparent",
                  }}
                >
                  <Text
                    style={[
                      styles.flightDateCardHeader,
                      { color: themeColors.textColor, marginBottom: 0 },
                    ]}
                  >
                    {inlineHeaderDateStr}
                  </Text>
                  {item.data.actualReportTime && (
                    <Text
                      style={{
                        fontFamily: "GoogleSans",
                        fontSize: 13,
                        color: themeColors.subTextColor,
                        marginLeft: 8,
                      }}
                    >
                      ({item.data.actualReportTime})
                    </Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.flightDetailsText,
                    { color: themeColors.textColor },
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

                {/* ──✅ UPDATE 2: APPEND VERTICAL DIVIDER AND COMPACT FLYING HOURS */}
                <Text
                  style={[
                    styles.flightTimeText,
                    { color: themeColors.subTextColor },
                  ]}
                >
                  {item.data.departureTimeLocal ||
                    item.data.departureTime.split("T")[1]}{" "}
                  — {item.data.arrivalTimeLocal || item.data.arrivalTime}
                  {item.data.flyingHours &&
                    (() => {
                      const raw = item.data.flyingHours.replace("PT", "");
                      const parts = raw.split("H");
                      const hours = parseInt(parts[0], 10) || 0;
                      const minutes =
                        parts.length > 1
                          ? parseInt(parts[1].replace("M", ""), 10) || 0
                          : 0;
                      return `  |  ${hours}hrs ${minutes}mins`;
                    })()}
                </Text>

                {/* ──✅ FIXED: Removed the standalone verbal text row completely */}
              </View>
            </View>
          </View>
        ) : (
          <View
            style={[styles.layoverBoxCard, { borderColor: themeColors.border }]}
          >
            <View style={styles.iconCenteringFrame}>
              <FontAwesome6
                name="hotel"
                size={12}
                color={themeColors.accent}
                style={styles.layoverIconMargin}
              />
            </View>
            <View style={styles.flightRoutingBlock}>
              <Text
                style={[
                  styles.flightDateCardHeader,
                  { color: themeColors.textColor },
                ]}
              >
                {inlineHeaderDateStr}
              </Text>
              <Text
                style={[
                  styles.layoverText,
                  { color: themeColors.subTextColor },
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
}

const styles = StyleSheet.create({
  itineraryItemRow: {
    flexDirection: "row",
    backgroundColor: "transparent",
    marginVertical: 6,
    width: "100%",
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
});
