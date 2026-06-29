import { Text, useThemeColor } from "@/components/Themed";
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
  // Use the built-in helper to get colors based on current mode
  const localTimeColor = useThemeColor({}, "localTime");
  const zuluTimeColor = useThemeColor({}, "zuluTime");
  const textColor = useThemeColor({}, "text");
  // Logic: Change the time color based on whether we are in Zulu or Local mode
  //const timeDisplayColor = !isZulu
  const timeDisplayColor = isZulu ? zuluTimeColor : localTimeColor;
  // ? themeColors.timelinePipe
  //: themeColors.subTextColor;

  return (
    <View style={styles.rowsWrapperBlock}>
      {/* Map through each step in the trip timeline */}
      {timeline.map((item, index) => {
        let sectorDisplayDateStr = formatCardHeaderDate(item.dateStr);
        let timeData = { dep: "", arr: "", report: "" };

        // If it's a flight, extract formatted time details using the helper
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
            {/* The vertical pipe circle node (the left-hand icon container) */}
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

                {/* Conditional render: Show flight details or simple Layover text */}
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

                    {/* Render times with the dynamic color defined above */}
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

              {/* Only show the 'chevron' if a press action is provided for sectors */}
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
  rowsWrapperBlock: { paddingLeft: 32 }, // Creates space for the vertical pipe
  itineraryItemRow: { marginVertical: 8 },
  pipeCircleNode: {
    position: "absolute",
    left: -32, // Positions the icon to the left of the content
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
