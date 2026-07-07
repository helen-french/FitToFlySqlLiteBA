import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

import { Text, View } from "@/components/Themed";
import { cardStyles as styles } from "@/components/history/historyStyles";
import { formatDisplayDate } from "@/components/history/historyUtils";
import { HistoryThemeColors, HydratedHistoryRow } from "@/db/history-types";

interface Props {
  row: HydratedHistoryRow;
  themeColors: HistoryThemeColors;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TripHistoryCard({
  row,
  themeColors,
  isExpanded,
  onToggle,
}: Props) {
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
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={!row.tripData}
        onPress={onToggle}
        style={styles.cardHeaderInteractiveRow}
      >
        <View style={{ flex: 1, backgroundColor: "transparent" }}>
          <View style={styles.badgeMetadataRow}>
            <View style={[styles.badgePill, { backgroundColor: row.badgeColor }]}>
              <Text style={styles.badgeText}>{row.badgeLabel}</Text>
            </View>
            {!!row.captureDate && (
              <Text
                style={[styles.metaText, { color: themeColors.subTextColor }]}
              >
                Sync Date: {row.captureDate}
              </Text>
            )}
          </View>

          {row.tripData && (
            <View style={{ backgroundColor: "transparent", marginTop: 4 }}>
              <Text
                style={{
                  fontFamily: "GoogleSansBold",
                  fontSize: 13,
                  color: themeColors.textColor,
                  marginBottom: 2,
                }}
              >
                {formatDisplayDate(row.tripData.startDateStr)} —{" "}
                {formatDisplayDate(row.tripData.endDateStr)}
              </Text>

              {/* ──✅ TRIP DEPARTURE VECTOR TRACKING LINKED BACK INTO PLACE */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}
              >
                <FontAwesome6
                  name="plane-departure"
                  size={12}
                  color={row.badgeColor} // changes the icon colour to match the active badge type
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.routingSummaryText,
                    { color: themeColors.textColor },
                  ]}
                >
                  {row.tripData.routingSummary}
                </Text>
              </View>
            </View>
          )}
        </View>

        {row.tripData && (
          <FontAwesome6
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={13}
            color={themeColors.subTextColor}
            style={{ marginLeft: 12 }}
          />
        )}
      </TouchableOpacity>

      {row.tripData && isExpanded && (
        <Animated.View
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(150)}
          style={styles.detailsTray}
        >
          <Text style={[styles.varianceNotes, { color: themeColors.subTextColor }]}>
            {row.amendment.details}
          </Text>

          <View style={styles.pipelineWrapper}>
            <View
              style={[
                styles.verticalTimelinePipe,
                { backgroundColor: themeColors.timelinePipe },
              ]}
            />
            <View style={styles.rowsWrapperBlock}>
              {row.tripData.timeline.map((secNode, index) => (
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
                      name={secNode.type === "flight" ? "plane" : "hotel"}
                      size={9}
                      color={themeColors.accent}
                      style={
                        secNode.type === "flight"
                          ? { transform: [{ rotate: "-45deg" }] }
                          : null
                      }
                    />
                  </View>

                  <View style={styles.elementDataBlock}>
                    <View style={styles.itemMetaLine}>
                      <Text
                        style={{
                          fontFamily: "GoogleSansBold",
                          fontSize: 14,
                          color: themeColors.textColor,
                        }}
                      >
                        {formatDisplayDate(secNode.dateStr)}
                      </Text>
                      {secNode.data?.actualReportTime && (
                        <Text
                          style={{
                            fontFamily: "GoogleSans",
                            fontSize: 13,
                            color: themeColors.subTextColor,
                            marginLeft: 8,
                          }}
                        >
                          | Report: {secNode.data.actualReportTime}
                        </Text>
                      )}
                    </View>

                    {secNode.type === "flight" && secNode.data ? (
                      <View style={{ backgroundColor: "transparent" }}>
                        <Text
                          style={{
                            fontFamily: "GoogleSans",
                            fontSize: 14,
                            color: themeColors.textColor,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: "GoogleSansBold",
                              color: themeColors.accent,
                            }}
                          >
                            {secNode.data.carrier}
                            {secNode.data.flightNumber}
                          </Text>{" "}
                          {secNode.data.departureStation} →{" "}
                          {secNode.data.arrivalStation}
                        </Text>
                        <Text
                          style={{
                            fontFamily: "GoogleSans",
                            fontSize: 13,
                            color: themeColors.subTextColor,
                            marginTop: 1,
                          }}
                        >
                          {secNode.data.departureTimeLocal?.substring(0, 5) ||
                            secNode.data.departureTime
                              .split("T")[1]
                              .substring(0, 5)}{" "}
                          —{" "}
                          {secNode.data.arrivalTimeLocal?.substring(0, 5) ||
                            secNode.data.arrivalTime.substring(0, 5)}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={{
                          fontFamily: "GoogleSans",
                          fontSize: 14,
                          color: themeColors.subTextColor,
                        }}
                      >
                        Layover / Rest Day
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
