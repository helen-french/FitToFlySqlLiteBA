import { Text } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface TripTimelineProps {
  timeline: any[];
  isZulu: boolean;
  themeColors: any;
  formatCardHeaderDate: (date: string) => string;
  getFlightDisplayDetails: (data: any) => any;
  onSectorPress?: (tripNumber: string) => void;
  tripNumber?: string;
}

export const TripTimeline = ({
  timeline,
  isZulu,
  themeColors,
  formatCardHeaderDate,
  getFlightDisplayDetails,
  onSectorPress,
  tripNumber,
}: TripTimelineProps) => {
  // Dynamic color logic: Green (Pipe) for Local, Gray (SubText) for Zulu
  const timeDisplayColor = !isZulu
    ? themeColors.timelinePipe
    : themeColors.subTextColor;

  return (
    <View style={styles.rowsWrapperBlock}>
      {timeline.map((item, index) => {
        let sectorDisplayDateStr = formatCardHeaderDate(item.dateStr);
        let timeData = { dep: "", arr: "", report: "" };

        if (item.type === "flight" && item.data) {
          const fmt = getFlightDisplayDetails(item.data);
          timeData = {
            dep: fmt.displayDepTime.split(" ")[0],
            arr: fmt.displayArrTime.split(" ")[0],
            report: fmt.displayReportTime,
          };
        }

        return (
          <View key={index} style={styles.itineraryItemRow}>
            <View
              style={[
                styles.pipeCircleNode,
                {
                  borderColor: themeColors.timelinePipe,
                  backgroundColor: themeColors.cardBg,
                },
              ]}
            >
              <FontAwesome6
                name={item.type === "flight" ? "plane" : "hotel"}
                size={9}
                color={themeColors.accent}
              />
            </View>
            <View style={styles.interactiveRowWrapper}>
              <View style={styles.elementDataBlock}>
                <Text
                  style={{
                    fontFamily: "GoogleSansBold",
                    fontSize: 14,
                    color: themeColors.textColor,
                  }}
                >
                  {sectorDisplayDateStr}
                </Text>
                {item.type === "flight" && item.data ? (
                  <View>
                    <Text
                      style={{
                        fontFamily: "GoogleSansBold",
                        color: themeColors.accent,
                        fontSize: 14,
                      }}
                    >
                      {item.data.carrier}
                      {item.data.flightNumber}
                    </Text>
                    <Text style={{ color: themeColors.textColor }}>
                      {item.data.departureStation} → {item.data.arrivalStation}
                    </Text>
                    {/* Dynamic color applied here */}
                    <Text
                      style={{
                        fontFamily: "GoogleSansBold",
                        color: timeDisplayColor,
                        marginTop: 2,
                      }}
                    >
                      {timeData.dep} — {timeData.arr}
                    </Text>
                    <Text
                      style={{ fontSize: 13, color: themeColors.subTextColor }}
                    >
                      Report: {timeData.report} (z - todo)
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: themeColors.subTextColor }}>
                    Layover / Rest Day
                  </Text>
                )}
              </View>
              {item.type === "flight" && onSectorPress && (
                <TouchableOpacity onPress={() => onSectorPress(tripNumber!)}>
                  <FontAwesome6
                    name="chevron-right"
                    size={12}
                    color={themeColors.subTextColor}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  rowsWrapperBlock: { paddingLeft: 32 },
  itineraryItemRow: { marginVertical: 8 },
  pipeCircleNode: {
    position: "absolute",
    left: -32,
    top: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  interactiveRowWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  elementDataBlock: { flex: 1 },
});
