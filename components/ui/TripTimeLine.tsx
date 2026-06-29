/* ## TripTimeline 

The `TripTimeline` component is responsible for rendering the individual segments of a trip's itinerary, distinguishing between flight sectors and hotel/turnaround stays. 

### How it works
*   **Item Differentiation**: It determines the item type (flight or non-flight) to conditionally render specific UI elements.
*   **Flight Rendering**: If the item is a flight, it retrieves formatted departure/arrival details and displays the flight carrier and route.
*   **Hotel Rendering**: If the item is not a flight, it renders a standardized "Hotel" row, serving as a placeholder for turnarounds or rest periods.
*   **Visual Styling**: It uses a vertical pipe and node structure to maintain visual continuity. Non-flight rows are styled with a distinct orange icon to differentiate them from the primary flight path.
*   **Interactive Elements**: For flight rows, it provides an optional chevron button to trigger navigation to sector-specific details.
 */

import { Text, useThemeColor } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import {
  Text as NativeText,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export const TripTimeline = ({
  item,
  isZulu,
  themeColors,
  formatCardHeaderDate,
  getFlightDisplayDetails,
  getShiftedDate,
  onSectorPress,
  tripNumber,
  index,
  timelineLength,
}: any) => {
  const isFlight = item.type === "flight" && !!item.data;

  const localTimeColor = useThemeColor({}, "localTime");
  const zuluTimeColor = useThemeColor({}, "zuluTime");
  const timeDisplayColor = isZulu ? zuluTimeColor : localTimeColor;

  // For flights, show the date; for Hotels, we skip the date.
  let dateStr = isFlight ? formatCardHeaderDate(item.dateStr) : "";
  let timeStr = "";
  let arrStr = "";
  let reportStr = "";

  if (isFlight) {
    const fmt = getFlightDisplayDetails(item.data);
    dateStr = fmt.displayDepDate;
    timeStr = fmt.displayDepTime.split(" ")[0];
    arrStr = fmt.displayArrTime.split(" ")[0];
    reportStr = fmt.displayReportTime;
  }

  return (
    <View style={styles.itineraryItemRow}>
      {/* Pipe and Node */}
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
          name={isFlight ? "plane" : "hotel"}
          size={9}
          color={isFlight ? themeColors.accent : "#FF9500"}
          style={isFlight ? { transform: [{ rotate: "-45deg" }] } : null}
        />
      </View>

      <View style={styles.interactiveRowWrapper}>
        <View style={styles.elementDataBlock}>
          {/* Header Row only renders if we have a date (for flights) */}
          {isFlight && (
            <View style={styles.headerRow}>
              <Text style={[styles.dateText, { color: themeColors.textColor }]}>
                {dateStr}
              </Text>
              {reportStr !== "" && (
                <Text
                  style={[
                    styles.reportText,
                    { color: themeColors.subTextColor },
                  ]}
                >
                  | Report: {reportStr}
                </Text>
              )}
            </View>
          )}

          {isFlight ? (
            <View>
              <Text
                style={[styles.flightText, { color: themeColors.textColor }]}
              >
                <Text
                  style={{
                    fontFamily: "GoogleSansBold",
                    color: themeColors.accent,
                  }}
                >
                  {item.data.carrier}
                  {item.data.flightNumber}
                </Text>{" "}
                {item.data.departureStation} → {item.data.arrivalStation}
              </Text>

              {/* Use NativeText, otherwise dynamic timeDisplayColor which changes on time mode gets overwritten by themed component  */}
              <NativeText
                style={[
                  styles.timeText,
                  { color: timeDisplayColor }, // Dynamic color from your variable
                ]}
              >
                {timeStr} — {arrStr}
              </NativeText>
            </View>
          ) : (
            <View style={{ marginTop: 1, marginBottom: 26 }}>
              <Text
                style={[
                  styles.flightText,
                  {
                    color: themeColors.textColor,
                    fontFamily: "GoogleSansBold",
                    fontSize: 14,
                  },
                ]}
              >
                Hotel
              </Text>
            </View>
          )}
        </View>

        {isFlight && onSectorPress && (
          <TouchableOpacity
            onPress={onSectorPress}
            style={styles.tabRedirectArrow}
          >
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
};

const styles = StyleSheet.create({
  itineraryItemRow: {
    backgroundColor: "transparent",
    marginVertical: 8,
    width: "100%",
    position: "relative",
  },
  pipeCircleNode: {
    position: "absolute",
    left: -32,
    top: -1, //changed from 2 to 0 to align with the top of the row
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
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    width: "100%",
  },
  elementDataBlock: { backgroundColor: "transparent", flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 3,
  },
  dateText: { fontFamily: "GoogleSansBold", fontSize: 14 },
  reportText: { fontFamily: "GoogleSans", fontSize: 13, marginLeft: 8 },
  flightText: { fontFamily: "GoogleSans", fontSize: 14 },

  timeText: { fontFamily: "GoogleSans", fontSize: 13, marginTop: 2 },

  tabRedirectArrow: {
    paddingLeft: 16,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
});
