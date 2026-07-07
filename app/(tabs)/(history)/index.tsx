/* Change History Screen 

This screen displays a chronological list of roster amendments, including flight and ground duty changes. 
It provides a month-based filter to view historical data and allows users to expand individual entries for more details.

TODO: possible filter on duty types, eg Trip, Ground, All etc.
TODO: possibly combine into a roster maintenance screen combined with roster loading capabilities
TODO: Extract the history row rendering into a reusable component (loadHistoryLogs).
TODO: lots of clean up of this screen is possible 
*/

import { FontAwesome6 } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { db } from "@/db/db";
import {
  dataLoad,
  duties,
  RosterAmendment,
  rosterAmendments,
  Sector,
  sectors,
  trips,
} from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

interface HistoryItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  data?: Sector & { actualReportTime?: string | null };
}

interface HydratedHistoryRow {
  id: string;
  amendment: RosterAmendment;
  captureDate: string;
  badgeColor: string;
  badgeLabel: string;
  tripData?: {
    startDateStr: string;
    endDateStr: string;
    routingSummary: string;
    timeline: HistoryItineraryItem[];
  };
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // System Time Anchor locked to your active data window (June 2026)
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    new Date("2026-06-16T12:00:00"),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [historyRows, setHistoryRows] = useState<HydratedHistoryRow[]>([]);
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>(
    {},
  );

  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      cardBg: isDark ? "#1C1C1E" : "#F2F2F7",
      nestedBoxBg: isDark ? "#2C2C2E" : "#FFFFFF",
      border: isDark ? "rgba(56, 56, 58, 0.4)" : "rgba(229, 229, 234, 0.6)",
      accent: "#007AFF",
      timelinePipe: "#34C759",
    }),
    [isDark],
  );

  const toggleAccordion = (rowId: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const formatDisplayDate = useCallback((dateStr: string) => {
    if (!dateStr || !dateStr.includes("-")) return dateStr;
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }, []);

  const loadHistoryLogs = useCallback(async () => {
    try {
      setIsLoading(true);

      const targetYear = selectedMonth.getFullYear();
      const targetMonth = selectedMonth.getMonth(); // 0-indexed (e.g., 6 for July)

      // Query all base amendments chronologically backwards
      const baseAmendments = await db
        .select()
        .from(rosterAmendments)
        .orderBy(desc(rosterAmendments.createdAt));

      const compositeRows: HydratedHistoryRow[] = [];

      for (const am of baseAmendments) {
        let captureDate = formatDisplayDate(am.createdAt.split("T")[0]);

        const loadOrigin = await db
          .select({ rosterDate: dataLoad.rosterDateOfCreation })
          .from(dataLoad)
          .where(eq(dataLoad.id, am.dataLoadId))
          .limit(1);

        if (loadOrigin.length > 0 && loadOrigin[0].rosterDate) {
          captureDate = formatDisplayDate(loadOrigin[0].rosterDate);
        }

        const badgeColor =
          am.changeType === "C"
            ? "#34C759"
            : am.changeType === "D"
              ? "#FF3B30"
              : "#007AFF";
        const badgeLabel =
          am.changeType === "C"
            ? "ADDED"
            : am.changeType === "D"
              ? "REMOVED"
              : "CHANGED";

        let tripData = undefined;
        let targetEventDateStr: string | null = null;

        if (am.itemType === "T" && am.identifier) {
          const tripQuery = await db
            .select()
            .from(trips)
            .where(eq(trips.tripNumber, am.identifier))
            .limit(1);

          if (tripQuery.length > 0) {
            const meta = tripQuery[0];

            // Baseline target setup directly from Trip master allocation data
            targetEventDateStr = meta.startDate;

            const sectorManifest = await db
              .select({
                id: sectors.id,
                tripNumber: sectors.tripNumber,
                dutyNumber: sectors.dutyNumber,
                sectorNumber: sectors.sectorNumber,
                carrier: sectors.carrier,
                flightNumber: sectors.flightNumber,
                departureStation: sectors.departureStation,
                arrivalStation: sectors.arrivalStation,
                departureTime: sectors.departureTime,
                departureTimeLocal: sectors.departureTimeLocal,
                arrivalTime: sectors.arrivalTime,
                arrivalTimeLocal: sectors.arrivalTimeLocal,
                actualReportTime: duties.actualReportTime,
              })
              .from(sectors)
              .leftJoin(
                duties,
                and(
                  eq(sectors.tripNumber, duties.tripNumber),
                  eq(sectors.dutyNumber, duties.dutyNumber),
                ),
              )
              .where(eq(sectors.tripNumber, meta.tripNumber))
              .orderBy(asc(sectors.departureTime), asc(sectors.sectorNumber));

            if (sectorManifest.length > 0) {
              const stations = [sectorManifest[0].departureStation];
              sectorManifest.forEach((s) => {
                if (stations[stations.length - 1] !== s.arrivalStation)
                  stations.push(s.arrivalStation);
              });

              const timeline: HistoryItineraryItem[] = [];
              for (let i = 0; i < sectorManifest.length; i++) {
                const currentSec = sectorManifest[i];
                const currentLocDate = currentSec.departureTime.split("T")[0];
                timeline.push({
                  type: "flight",
                  dateStr: currentLocDate,
                  data: currentSec as any,
                });

                if (i < sectorManifest.length - 1) {
                  const nextSec = sectorManifest[i + 1];
                  const nextLocDate = nextSec.departureTime.split("T")[0];
                  const d1 = new Date(`${currentLocDate}T12:00:00`);
                  const d2 = new Date(`${nextLocDate}T12:00:00`);

                  if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                    const diff = Math.ceil(
                      Math.abs(d2.getTime() - d1.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    if (diff > 1) {
                      for (let d = 1; d < diff; d++) {
                        const layoverDate = new Date(d1);
                        layoverDate.setDate(d1.getDate() + d);
                        timeline.push({
                          type: "layover",
                          dateStr: layoverDate.toISOString().split("T")[0],
                        });
                      }
                    }
                  }
                }
              }

              tripData = {
                startDateStr: timeline[0].dateStr,
                endDateStr: timeline[timeline.length - 1].dateStr,
                routingSummary: stations.join(" → "),
                timeline,
              };

              // Re-evaluate matching context strictly off parsed timeline bounds
              targetEventDateStr = timeline[0].dateStr;
            }
          }
        } else {
          // Future-proofing parsing blocks for ground notifications matching regex lines
          const dateMatch = am.details?.match(/\d{4}-\d{2}-\d{2}/);
          if (dateMatch) {
            targetEventDateStr = dateMatch[0];
          }
        }

        // ──✅ DYNAMIC MONTH FILTER ENGINE (Pushes logs directly to their action month)
        if (targetEventDateStr) {
          const parsedDate = new Date(`${targetEventDateStr}T12:00:00`);
          if (!isNaN(parsedDate.getTime())) {
            if (
              parsedDate.getFullYear() !== targetYear ||
              parsedDate.getMonth() !== targetMonth
            ) {
              continue; // Skips this row! It will render cleanly on its operational month view.
            }
          }
        }

        compositeRows.push({
          id: `AMEND_${am.id}`,
          amendment: am,
          captureDate,
          badgeColor,
          badgeLabel,
          tripData,
        });
      }

      setHistoryRows(compositeRows);
    } catch (err) {
      console.error("Historical lookup synthesis loop failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, formatDisplayDate]);

  useFocusEffect(
    useCallback(() => {
      loadHistoryLogs();
    }, [loadHistoryLogs]),
  );

  const shiftMonth = (direction: "prev" | "next") => {
    const adjusted = new Date(selectedMonth);
    adjusted.setMonth(
      selectedMonth.getMonth() + (direction === "next" ? 1 : -1),
    );
    setSelectedMonth(adjusted);
  };

  const renderHistoryItem = (item: HydratedHistoryRow) => {
    const isExpanded = !!expandedRows[item.id];

    switch (item.amendment.itemType) {
      case "T":
        return (
          <View
            key={item.id}
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
              disabled={!item.tripData}
              onPress={() => toggleAccordion(item.id)}
              style={styles.cardHeaderInteractiveRow}
            >
              <View style={{ flex: 1, backgroundColor: "transparent" }}>
                <View style={styles.badgeMetadataRow}>
                  <View
                    style={[
                      styles.badgePill,
                      { backgroundColor: item.badgeColor },
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.badgeLabel}</Text>
                  </View>
                  <Text
                    style={[
                      styles.metaText,
                      { color: themeColors.subTextColor },
                    ]}
                  >
                    Sync Date: {item.captureDate}
                  </Text>
                </View>

                {item.tripData && (
                  <View
                    style={{ backgroundColor: "transparent", marginTop: 4 }}
                  >
                    <Text
                      style={{
                        fontFamily: "GoogleSansBold",
                        fontSize: 13,
                        color: themeColors.textColor,
                        marginBottom: 2,
                      }}
                    >
                      {formatDisplayDate(item.tripData.startDateStr)} —{" "}
                      {formatDisplayDate(item.tripData.endDateStr)}
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
                        color={item.badgeColor} // ──✅ DYNAMICALLY WALKS ICON COLOR TO MATCH THE ACTIVE BADGE TYPE
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.routingSummaryText,
                          { color: themeColors.textColor },
                        ]}
                      >
                        {item.tripData.routingSummary}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {item.tripData && (
                <FontAwesome6
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={13}
                  color={themeColors.subTextColor}
                  style={{ marginLeft: 12 }}
                />
              )}
            </TouchableOpacity>

            {item.tripData && isExpanded && (
              <Animated.View
                entering={FadeInUp.duration(200)}
                exiting={FadeOutDown.duration(150)}
                style={styles.detailsTray}
              >
                <Text
                  style={[
                    styles.varianceNotes,
                    { color: themeColors.subTextColor },
                  ]}
                >
                  {item.amendment.details}
                </Text>

                <View style={styles.pipelineWrapper}>
                  <View
                    style={[
                      styles.verticalTimelinePipe,
                      { backgroundColor: themeColors.timelinePipe },
                    ]}
                  />
                  <View style={styles.rowsWrapperBlock}>
                    {item.tripData.timeline.map((secNode, index) => (
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
                                {secNode.data.departureTimeLocal?.substring(
                                  0,
                                  5,
                                ) ||
                                  secNode.data.departureTime
                                    .split("T")[1]
                                    .substring(0, 5)}{" "}
                                —{" "}
                                {secNode.data.arrivalTimeLocal?.substring(
                                  0,
                                  5,
                                ) || secNode.data.arrivalTime.substring(0, 5)}
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

      case "G":
        return (
          <View
            key={item.id}
            style={[
              styles.historyCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.badgeMetadataRow}>
              <View
                style={[styles.badgePill, { backgroundColor: item.badgeColor }]}
              >
                <Text style={styles.badgeText}>{item.badgeLabel}</Text>
              </View>
              <Text
                style={[styles.metaText, { color: themeColors.subTextColor }]}
              >
                Ground Duty • Sync: {item.captureDate}
              </Text>
            </View>
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
                //color="#FF9500"
                color={item.badgeColor}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.genericDetailsText,
                  {
                    color: themeColors.textColor,
                    fontFamily: "GoogleSansBold",
                  },
                ]}
              >
                {item.amendment.details}
              </Text>
            </View>
          </View>
        );

      case "D":
      case "S":
      default:
        return (
          <View
            key={item.id}
            style={[
              styles.historyCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.badgeMetadataRow}>
              <View
                style={[styles.badgePill, { backgroundColor: item.badgeColor }]}
              >
                <Text style={styles.badgeText}>{item.badgeLabel}</Text>
              </View>
              <Text
                style={[styles.metaText, { color: themeColors.subTextColor }]}
              >
                Roster Update • Sync: {item.captureDate}
              </Text>
            </View>
            <Text
              style={[
                styles.genericDetailsText,
                { color: themeColors.textColor, marginTop: 4 },
              ]}
            >
              {item.amendment.details}
            </Text>
          </View>
        );
    }
  };

  return (
    <TabScreenLayout onRefresh={loadHistoryLogs}>
      <View
        style={[styles.monthPickerHeader, { borderColor: themeColors.border }]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => shiftMonth("prev")}
          style={styles.navArrowButton}
        >
          <FontAwesome6
            name="chevron-left"
            size={14}
            color={themeColors.accent}
          />
        </TouchableOpacity>

        <Text style={[styles.monthLabel, { color: themeColors.textColor }]}>
          {selectedMonth.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          })}
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => shiftMonth("next")}
          style={styles.navArrowButton}
        >
          <FontAwesome6
            name="chevron-right"
            size={14}
            color={themeColors.accent}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centeredState}>
          // this is the loading state, showing an activity indicator while data
          is being fetched // and the "Loading history..." text is displayed
          above the indicator // TODO: Change activity indicator to cutom engine
          spiinner animation // TODO: Have a standard loading state component
          for all screens that require data fetching // TODO: Have a standard
          subtext style
          <Text
            style={{
              fontFamily: "GoogleSans",
              fontSize: 14,
              color: themeColors.subTextColor,
              marginBottom: 12,
            }}
          >
            Loading history...
          </Text>
          <ActivityIndicator size="large" color={themeColors.accent} />
        </View>
      ) : historyRows.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={themeColors.accent} />
        </View>
      ) : (
        <View style={styles.listContentPadding}>
          {historyRows.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text
                style={{
                  fontFamily: "GoogleSans",
                  fontSize: 14,
                  color: themeColors.subTextColor,
                  textAlign: "center",
                }}
              >
                No roster changes are recorded for this monthly calendar block.
              </Text>
            </View>
          ) : (
            historyRows.map((row) => renderHistoryItem(row))
          )}
        </View>
      )}
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  monthPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  navArrowButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  centeredState: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
  },
  listContentPadding: {
    paddingBottom: 80,
  },
  historyCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderInteractiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  badgeMetadataRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 6,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeText: {
    fontFamily: "GoogleSansBold",
    fontSize: 9,
    color: "#FFFFFF",
  },
  metaText: {
    fontFamily: "GoogleSansBold",
    fontSize: 12,
  },
  routingSummaryText: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  genericDetailsText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    lineHeight: 19,
    marginTop: 2,
  },
  detailsTray: {
    backgroundColor: "transparent",
    marginTop: 10,
    width: "100%",
  },
  varianceNotes: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  pipelineWrapper: {
    flexDirection: "row",
    backgroundColor: "transparent",
    width: "100%",
    position: "relative",
    marginTop: 4,
  },
  verticalTimelinePipe: {
    position: "absolute",
    left: 11,
    top: 4,
    bottom: 20,
    width: 2,
    borderRadius: 1,
  },
  rowsWrapperBlock: {
    flex: 1,
    backgroundColor: "transparent",
    paddingLeft: 32,
  },
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
  elementDataBlock: {
    backgroundColor: "transparent",
    flex: 1,
  },
  itemMetaLine: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 3,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
});
