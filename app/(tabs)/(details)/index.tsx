import { FontAwesome6 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ViewToken,
} from "react-native";
import Animated, {
  FadeInUp,
  FadeOutDown,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/Header";
import RosterAmendmentBanner from "@/components/RosterAmendmentBanner";
import { Text, View } from "@/components/Themed";
import CalendarCard from "@/components/summary/CalendarCard";
import SkyHeader from "@/components/ui/SkyHeader";
import { TripTimeline } from "@/components/ui/TripTimeLine";

import { useTimeModeZOrL } from "@/components/TimeModeZOrL";
import { useAmendments } from "@/components/useAmendments";
import { useFlightTimeFormatter } from "@/components/useFlightTimeFormatter";
import { useTripData } from "@/components/useTripData"; // Hook imported
import { TimelineRow } from "@/constants/timeline";
import { db } from "@/db/db";
import { dataLoad, RosterAmendment, sectors, trips } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

type FilterType = "ALL" | "TRIPS" | "GROUND";

interface ModalHydratedAmendment {
  amendment: RosterAmendment;
  captureDate: string;
  tripDatesSummary?: string;
  tripRoutingSummary?: string;
}

export default function DetailsSummaryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const { isZulu, toggleTimeMode } = useTimeModeZOrL();
  const { getFlightDisplayDetails, formatCardHeaderDate, getShiftedDate } =
    useFlightTimeFormatter();

  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      pageBg: isDark ? "#000000" : "#FFFFFF",
      calendarCardBg: isDark
        ? "rgba(28, 28, 30, 0.85)"
        : "rgba(242, 242, 247, 0.85)",
      cardBg: isDark ? "#1C1C1E" : "#FFFFFF",
      nestedBoxBg: isDark ? "#3A3A3C" : "#FFFFFF",
      border: isDark ? "rgba(56, 56, 58, 0.4)" : "rgba(229, 229, 234, 0.6)",
      accent: "#007AFF",
      timelinePipe: "#34C759",
      modalOverlay: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.4)",
      toggleBgActive: "#34C759",
      toggleBgInactive: isDark ? "#3A3A3C" : "#D1D1D6",
      toggleActivePill: isDark ? "#48484A" : "#FFFFFF",
    }),
    [isDark],
  );

  const todayAnchor = useMemo(() => new Date("2026-06-16T12:00:00"), []);
  const [selectedDate, setSelectedDate] = useState<Date>(todayAnchor);
  const [currentViewMonth, setCurrentViewMonth] = useState<Date>(todayAnchor);

  // Use the new hook here
  const { timelineRows, isLoading, loadTripData } =
    useTripData(currentViewMonth);

  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [expandedTrips, setExpandedTrips] = useState<{
    [key: string]: boolean;
  }>({});
  const [isMonthExpanded, setIsMonthExpanded] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { amendments } = useAmendments(currentViewMonth);
  const [hydratedModalRows, setHydratedModalRows] = useState<
    ModalHydratedAmendment[]
  >([]);
  const [isHydratingModal, setIsHydratingModal] = useState<boolean>(false);

  const flatListRef = useRef<FlatList<TimelineRow>>(null);
  const isAutoScrolling = useRef<boolean>(false);
  const hasInitiallySynced = useRef<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      loadTripData();
    }, [loadTripData]),
  );

  const filteredTimelineRows = useMemo(() => {
    if (filterType === "TRIPS")
      return timelineRows.filter((row) => row.type === "T");
    if (filterType === "GROUND")
      return timelineRows.filter((row) => row.type === "G");
    return timelineRows;
  }, [timelineRows, filterType]);

  const toggleTripAccordion = (tripNumber: string) => {
    setExpandedTrips((prev) => ({ ...prev, [tripNumber]: !prev[tripNumber] }));
  };

  const getLocalDateString = useCallback((date: Date): string => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().split("T")[0];
  }, []);

  const scrollToDateInList = useCallback(
    (targetDate: Date) => {
      if (filteredTimelineRows.length === 0) return;
      const dateKey = getLocalDateString(targetDate);
      const targetIndex = filteredTimelineRows.findIndex((row) => {
        if (row.type === "T" && row.tripData) {
          return (
            dateKey >= row.tripData.calculatedStartDate &&
            dateKey <= row.tripData.calculatedEndDate
          );
        }
        return row.startDate === dateKey;
      });

      const finalIndex =
        targetIndex !== -1
          ? targetIndex
          : filteredTimelineRows.findIndex((row) => row.startDate >= dateKey);

      if (finalIndex !== -1 && flatListRef.current) {
        isAutoScrolling.current = true;
        flatListRef.current.scrollToIndex({
          index: finalIndex,
          animated: true,
          viewPosition: 0,
        });
        setTimeout(() => (isAutoScrolling.current = false), 600);
      }
    },
    [filteredTimelineRows, getLocalDateString],
  );

  const hydrateModalAmendments = useCallback(async () => {
    if (!amendments || amendments.length === 0) {
      setHydratedModalRows([]);
      return;
    }
    try {
      setIsHydratingModal(true);
      const compositeRows: ModalHydratedAmendment[] = [];
      for (const am of amendments) {
        let captureDate = formatCardHeaderDate(am.createdAt.split("T")[0]);
        const loadOrigin = await db
          .select({ rosterDate: dataLoad.rosterDateOfCreation })
          .from(dataLoad)
          .where(eq(dataLoad.id, am.dataLoadId))
          .limit(1);
        if (loadOrigin.length > 0 && loadOrigin[0].rosterDate)
          captureDate = formatCardHeaderDate(loadOrigin[0].rosterDate);
        if (am.itemType === "T" && am.identifier) {
          const tripTarget = await db
            .select()
            .from(trips)
            .where(eq(trips.tripNumber, am.identifier))
            .limit(1);
          if (tripTarget.length > 0) {
            const tMeta = tripTarget[0];
            const tripDatesSummary = `${formatCardHeaderDate(tMeta.startDate)} — ${formatCardHeaderDate(tMeta.endDate)}`;
            const tripSectors = await db
              .select({
                departureStation: sectors.departureStation,
                arrivalStation: sectors.arrivalStation,
              })
              .from(sectors)
              .where(eq(sectors.tripNumber, tMeta.tripNumber))
              .orderBy(asc(sectors.departureTime), asc(sectors.sectorNumber));
            let tripRoutingSummary = "";
            if (tripSectors.length > 0) {
              const stations = [tripSectors[0].departureStation];
              tripSectors.forEach((s) => {
                if (stations[stations.length - 1] !== s.arrivalStation)
                  stations.push(s.arrivalStation);
              });
              tripRoutingSummary = stations.join(" → ");
            }
            compositeRows.push({
              amendment: am,
              captureDate,
              tripDatesSummary,
              tripRoutingSummary,
            });
            continue;
          }
        }
        compositeRows.push({ amendment: am, captureDate });
      }
      setHydratedModalRows(compositeRows);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHydratingModal(false);
    }
  }, [amendments, formatCardHeaderDate]);

  useEffect(() => {
    if (isModalOpen) hydrateModalAmendments();
  }, [isModalOpen, hydrateModalAmendments]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (
        isAutoScrolling.current ||
        viewableItems.length === 0 ||
        filteredTimelineRows.length === 0
      )
        return;
      const topVisibleItem = viewableItems[0].item as TimelineRow;
      if (!topVisibleItem) return;
      const rowDateStr =
        topVisibleItem.type === "T" && topVisibleItem.tripData
          ? topVisibleItem.tripData.calculatedStartDate
          : topVisibleItem.startDate;
      const itemDateObj = new Date(`${rowDateStr}T12:00:00`);
      if (!isNaN(itemDateObj.getTime())) {
        setSelectedDate(itemDateObj);
        setCurrentViewMonth(itemDateObj);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 15 }).current;

  useEffect(() => {
    if (!isLoading && filteredTimelineRows.length > 0) {
      const timer = setTimeout(() => {
        scrollToDateInList(selectedDate);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isLoading, filterType]);

  useEffect(() => {
    if (
      !isLoading &&
      filteredTimelineRows.length > 0 &&
      !hasInitiallySynced.current
    ) {
      const timer = setTimeout(() => {
        scrollToDateInList(todayAnchor);
        hasInitiallySynced.current = true;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, filteredTimelineRows, todayAnchor, scrollToDateInList]);

  const dutyMarkerMap = useMemo(() => {
    const map: { [dateKey: string]: "flight" | "layover" | "ground" } = {};
    timelineRows.forEach((row) => {
      if (row.type === "T" && row.tripData) {
        row.tripData.timeline.forEach((item) => {
          map[item.dateStr] = "flight";
          if (item.endDateStr) {
            let currentCursor = new Date(`${item.dateStr}T12:00:00`);
            const finalCursor = new Date(`${item.endDateStr}T12:00:00`);
            while (currentCursor <= finalCursor) {
              const k = currentCursor.toISOString().split("T")[0];
              map[k] = "flight";
              currentCursor.setDate(currentCursor.getDate() + 1);
            }
          }
        });
      } else if (row.type === "G") {
        map[row.startDate] = "ground";
      }
    });
    return map;
  }, [timelineRows]);

  const activeCalendarDays = useMemo(() => {
    if (isMonthExpanded) {
      const firstDay = new Date(
        currentViewMonth.getFullYear(),
        currentViewMonth.getMonth(),
        1,
      );
      const startDayIndex = firstDay.getDay();
      firstDay.setDate(
        firstDay.getDate() + (startDayIndex === 0 ? -6 : 1 - startDayIndex),
      );
      return Array.from({ length: 35 }, (_, i) => {
        const d = new Date(firstDay);
        d.setDate(firstDay.getDate() + i);
        return d;
      });
    }
    const startOfWeek = new Date(currentViewMonth);
    const dayIndex = startOfWeek.getDay();
    startOfWeek.setDate(
      startOfWeek.getDate() + (dayIndex === 0 ? -6 : 1 - dayIndex),
    );
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [currentViewMonth, isMonthExpanded]);

  const animatedThumbStyle = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: withTiming(isZulu ? 22 : 2, { duration: 200 }) },
      ],
    }),
    [isZulu],
  );

  const renderTimelineItem = useCallback(
    ({ item }: { item: TimelineRow }) => {
      if (item.type === "T" && item.tripData) {
        const rotation = item.tripData;
        const isExpanded = !!expandedTrips[rotation.tripMeta.tripNumber];
        const activeDurationDays = isZulu
          ? rotation.trueZuluDurationDays
          : rotation.trueLocalDurationDays;
        const firstFlightData = rotation.timeline.find(
          (t) => t.type === "flight",
        )?.data;
        const lastFlightData = [...rotation.timeline]
          .reverse()
          .find((t) => t.type === "flight")?.data;
        let displayHeaderStartDate = formatCardHeaderDate(
          rotation.calculatedStartDate,
        );
        let displayHeaderEndDate = formatCardHeaderDate(
          rotation.calculatedEndDate,
        );
        if (firstFlightData && lastFlightData) {
          const firstDetails = getFlightDisplayDetails(firstFlightData);
          const lastDetails = getFlightDisplayDetails(lastFlightData);
          displayHeaderStartDate = firstDetails.displayDepDate;
          displayHeaderEndDate = lastDetails.displayArrDate;
        }
        return (
          <Animated.View
            style={[
              styles.tripContainerCard,
              { backgroundColor: themeColors.cardBg },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleTripAccordion(rotation.tripMeta.tripNumber)}
              style={styles.nestedCardHeaderRow}
            >
              <View style={{ backgroundColor: "transparent", flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "GoogleSansBold",
                    fontSize: 13,
                    color: themeColors.textColor,
                    marginBottom: 4,
                  }}
                >
                  {displayHeaderStartDate} — {displayHeaderEndDate}
                </Text>
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
                    color={themeColors.accent}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.routingSummaryText,
                      { color: themeColors.textColor },
                    ]}
                  >
                    {rotation.routingSummary}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}
              >
                <Text
                  style={{
                    fontFamily: "GoogleSansBold",
                    fontSize: 13,
                    color: themeColors.subTextColor,
                    marginRight: 10,
                  }}
                >{`${activeDurationDays} ${activeDurationDays === 1 ? "Day" : "Days"}`}</Text>
                <FontAwesome6
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={themeColors.subTextColor}
                />
              </View>
            </TouchableOpacity>
            {isExpanded && (
              <Animated.View
                entering={FadeInUp.duration(250)}
                exiting={FadeOutDown.duration(200)}
                style={styles.accordionDetailsTray}
              >
                <View
                  style={[
                    styles.nestedHeaderDividerLine,
                    { borderBottomColor: themeColors.border },
                  ]}
                />
                <View style={[styles.timelinePipelineContainer]}>
                  <View
                    style={[
                      styles.verticalTimelinePipe,
                      { backgroundColor: themeColors.timelinePipe },
                    ]}
                  />
                  <View style={styles.rowsWrapperBlock}>
                    {rotation.timeline.map((item, index) => (
                      <TripTimeline
                        key={index}
                        item={item}
                        isZulu={isZulu}
                        themeColors={themeColors}
                        formatCardHeaderDate={formatCardHeaderDate}
                        getFlightDisplayDetails={getFlightDisplayDetails}
                        getShiftedDate={getShiftedDate}
                        tripNumber={rotation.tripMeta.tripNumber}
                        onSectorPress={() =>
                          router.push({
                            pathname: "/(tabs)/(sectors)",
                            params: {
                              tripNumber: rotation.tripMeta.tripNumber,
                              startDate: rotation.calculatedStartDate,
                              endDate: rotation.calculatedEndDate,
                              routing: rotation.routingSummary,
                            },
                          })
                        }
                      />
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        );
      }
      if (item.type === "G" && item.groundData) {
        const gd = item.groundData;
        return (
          <Animated.View
            style={[
              styles.tripContainerCard,
              { backgroundColor: themeColors.cardBg, paddingVertical: 14 },
            ]}
          >
            <View style={{ backgroundColor: "transparent", width: "100%" }}>
              <Text
                style={{
                  fontFamily: "GoogleSansBold",
                  fontSize: 13,
                  color: themeColors.textColor,
                  marginBottom: 4,
                }}
              >
                {formatCardHeaderDate(gd.startDate)}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}
              >
                <FontAwesome6
                  name="plane-slash"
                  size={13}
                  color="#FF9500"
                  style={{ marginRight: 6 }}
                />
                <View style={{ backgroundColor: "transparent", flex: 1 }}>
                  <Text
                    style={[
                      styles.routingSummaryText,
                      { color: themeColors.textColor },
                    ]}
                  >
                    Ground Duty{" "}
                    <Text
                      style={{
                        fontFamily: "GoogleSans",
                        color: themeColors.subTextColor,
                        fontSize: 14,
                      }}
                    >
                      | {gd.crewMovementCode}
                    </Text>
                  </Text>
                  {gd.creditAmount && (
                    <Text
                      style={{
                        fontFamily: "GoogleSans",
                        fontSize: 13,
                        color: themeColors.subTextColor,
                        marginTop: 3,
                      }}
                    >
                      Credit Amount:{" "}
                      <Text>
                        {gd.creditAmount
                          .replace("PT", "")
                          .replace("H", "hrs ")
                          .replace("M", "mins")}
                      </Text>
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>
        );
      }
      return null;
    },
    [
      expandedTrips,
      themeColors,
      formatCardHeaderDate,
      getFlightDisplayDetails,
      getShiftedDate,
      isZulu,
      router,
    ],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.pageBg }]}
    >
      <SkyHeader
        height={190}
        showClouds={true}
        style={styles.absoluteSkyPosition}
      />
      <Header onImportSuccess={loadTripData} />
      <CalendarCard
        activeCalendarDays={activeCalendarDays}
        selectedDate={selectedDate}
        currentViewMonth={currentViewMonth}
        isMonthExpanded={isMonthExpanded}
        dutyMarkerMap={dutyMarkerMap}
        themeColors={{ ...themeColors, cardBg: themeColors.calendarCardBg }}
        getLocalDateString={getLocalDateString}
        onDaySelect={(date) => {
          setSelectedDate(date);
          setCurrentViewMonth(date);
          scrollToDateInList(date);
        }}
        onNavigate={(dir) => {
          const newDate = new Date(currentViewMonth);
          isMonthExpanded
            ? newDate.setMonth(
                currentViewMonth.getMonth() + (dir === "next" ? 1 : -1),
              )
            : newDate.setDate(
                currentViewMonth.getDate() + (dir === "next" ? 7 : -7),
              );
          setCurrentViewMonth(newDate);
          setTimeout(() => scrollToDateInList(newDate), 50);
        }}
        onResetToday={() => {
          setSelectedDate(todayAnchor);
          setCurrentViewMonth(todayAnchor);
          scrollToDateInList(todayAnchor);
        }}
        onToggleExpand={() => setIsMonthExpanded(!isMonthExpanded)}
      />
      <RosterAmendmentBanner
        viewingDate={currentViewMonth}
        onPress={() => setIsModalOpen(true)}
      />
      <View style={styles.controlsRowWrapper}>
        <View
          style={[
            styles.segmentContainer,
            {
              backgroundColor: themeColors.calendarCardBg,
              borderColor: themeColors.border,
              borderWidth: 1,
            },
          ]}
        >
          {["ALL", "TRIPS", "GROUND"].map((type) => (
            <TouchableOpacity
              key={type}
              activeOpacity={0.8}
              onPress={() => setFilterType(type as FilterType)}
              style={[
                styles.segmentButton,
                filterType === type && [
                  styles.segmentActivePill,
                  { backgroundColor: themeColors.nestedBoxBg },
                ],
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color:
                      filterType === type
                        ? themeColors.textColor
                        : themeColors.subTextColor,
                  },
                ]}
              >
                {type === "ALL" ? "All" : type === "TRIPS" ? "Trips" : "Ground"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
          }}
        >
          <View style={styles.fixedTimezoneTextWrapper}>
            <Text
              style={{
                fontFamily: "GoogleSansBold",
                fontSize: 13,
                color: themeColors.textColor,
              }}
            >
              {isZulu ? "Zulu" : "Local"}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={toggleTimeMode}
            style={[
              styles.iosSwitchContainer,
              {
                backgroundColor: isZulu
                  ? themeColors.toggleBgInactive
                  : themeColors.toggleBgActive,
              },
            ]}
          >
            <Animated.View
              style={[styles.iosSwitchThumb, animatedThumbStyle]}
            />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        ref={flatListRef}
        data={filteredTimelineRows}
        keyExtractor={(item) => item.id}
        renderItem={renderTimelineItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={false}
        style={styles.container}
        contentContainerStyle={styles.mainScrollContentPadding}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0,
            });
          });
        }}
        ListEmptyComponent={
          <View style={styles.emptyComponentBlock}>
            <Text
              style={{
                fontFamily: "GoogleSans",
                color: themeColors.subTextColor,
                fontSize: 14,
              }}
            >
              No items match this filter category.
            </Text>
          </View>
        }
      />
      {/* ... Modal section remains identical ... */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        {/* Modal content omitted for brevity, but you should keep your existing modal JSX here */}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  mainScrollContentPadding: { paddingBottom: 140 },
  absoluteSkyPosition: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  controlsRowWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  segmentContainer: {
    flexDirection: "row",
    height: 34,
    borderRadius: 9,
    padding: 2,
    flex: 1,
    marginRight: 16,
  },
  segmentButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
  },
  segmentActivePill: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 2,
  },
  segmentLabel: { fontFamily: "GoogleSansBold", fontSize: 13 },
  fixedTimezoneTextWrapper: {
    width: 42,
    alignItems: "flex-start",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iosSwitchContainer: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  iosSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 3,
  },
  emptyComponentBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  tripContainerCard: {
    borderRadius: 20,
    padding: 16,
    width: "100%",
    marginBottom: 16,
    overflow: "hidden",
  },
  nestedCardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    width: "100%",
  },
  routingSummaryText: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  accordionDetailsTray: {
    backgroundColor: "transparent",
    marginTop: 0,
    width: "100%",
  },
  nestedHeaderDividerLine: {
    borderBottomWidth: 1,
    marginBottom: 10,
    marginTop: 8,
    opacity: 0.15,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalTrayContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    height: "75%",
    width: "100%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "transparent",
    paddingBottom: 20,
  },
  modalTitleText: {
    fontFamily: "GoogleSansBold",
    fontSize: 20,
    letterSpacing: -0.4,
  },
  closeTrayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalItemsScrollList: { flex: 1, marginTop: 4 },
  amendmentItemCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
    width: "100%",
    position: "relative",
  },
  itemCardVisualIndicatorLine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  itemCardTopMetadataRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 8,
  },
  badgePillMarker: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeLabelText: {
    fontFamily: "GoogleSansBold",
    fontSize: 9,
    color: "#FFFFFF",
  },
  coordinatesLabelText: { fontFamily: "GoogleSansBold", fontSize: 12 },
  centeredLoadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timelinePipelineContainer: {
    flexDirection: "row",
    backgroundColor: "transparent",
    width: "100%",
    position: "relative",
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
});
