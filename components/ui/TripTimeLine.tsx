import { Text } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

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
  // Logic to determine display strings based on item type
  const isFlight = item.type === "flight" && !!item.data;

  let dateStr = formatCardHeaderDate(item.dateStr);
  let timeStr = "";
  let arrStr = "";
  let reportStr = "";
  let layoverDuration = item.layoverDurationHours;

  if (isFlight) {
    const fmt = getFlightDisplayDetails(item.data);
    dateStr = fmt.displayDepDate;
    timeStr = fmt.displayDepTime.split(" ")[0];
    arrStr = fmt.displayArrTime.split(" ")[0];
    reportStr = fmt.displayReportTime;
  } else if (
    item.type === "layover" &&
    item.endDateStr &&
    item.endDateStr !== item.dateStr
  ) {
    dateStr = `${formatCardHeaderDate(item.dateStr)} — ${formatCardHeaderDate(item.endDateStr)}`;
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
          color={themeColors.accent}
          style={isFlight ? { transform: [{ rotate: "-45deg" }] } : null}
        />
      </View>

      <View style={styles.interactiveRowWrapper}>
        <View style={styles.elementDataBlock}>
          <View style={styles.headerRow}>
            <Text style={[styles.dateText, { color: themeColors.textColor }]}>
              {dateStr}
            </Text>
            {isFlight && reportStr !== "" && (
              <Text
                style={[styles.reportText, { color: themeColors.subTextColor }]}
              >
                | Report: {reportStr}
              </Text>
            )}
          </View>

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
              <Text
                style={[styles.timeText, { color: themeColors.subTextColor }]}
              >
                {timeStr} — {arrStr}
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 1 }}>
              <Text
                style={[styles.flightText, { color: themeColors.textColor }]}
              >
                Layover / Rest Day
              </Text>
              {layoverDuration && (
                <Text
                  style={[
                    styles.reportText,
                    { color: themeColors.subTextColor },
                  ]}
                >
                  {layoverDuration}hrs
                </Text>
              )}
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
