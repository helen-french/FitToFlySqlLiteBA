/**
 * Details (Trip) screen
 *
 * Calendar + chronological list of trips and ground duties for the active
 * roster manifests. This file owns **data load, calendar sync, filters, and
 * expand state**. Visual cards are thin wrappers over shared `components/roster/*`.
 *
 * ## File map (siblings in this folder)
 *
 * | File | Role |
 * | --- | --- |
 * | `index.tsx` (this) | DB → `UnifiedTimelineRow[]`, calendar, FlatList orchestration |
 * | `DetailsTripCard.tsx` | Trip accordion UI + sector chevron → Sectors tab |
 * | `DetailsGroundCard.tsx` | Ground accordion UI |
 * | `mapDetailsToRosterVM.ts` | Adapters: Details payload → shared roster VMs |
 * | `RosterUpdatesModal.tsx` | Month amendments tray (History cards, flat / non-expandable) |
 *
 * ## Data flow
 *
 * 1. `loadSummaryData` walks `roster` (active dataLoad ids) → trips/sectors or groundDuties
 * 2. Builds `timelineRows: UnifiedTimelineRow[]` (T = trip, G = ground)
 * 3. FlatList renders via `DetailsTripCard` / `DetailsGroundCard`
 * 4. Those cards call `mapDetailsToRosterVM` then shared roster presentational pieces
 *
 * Shared trip duration: `getTripDurationDays` in `@/lib/utils` (also used by History).
 * Local/Zulu labels & greens: cards use `useFlightTimeFormatter` + `Colors.localTime`.
 */

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
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/Header";
import RosterAmendmentBanner from "@/components/RosterAmendmentBanner";
import { Text, View } from "@/components/Themed";
import { useTimeModeZOrL } from "@/components/TimeModeZOrL";
import {
  ROSTER_CARD_DARK_BG,
  ROSTER_CARD_DARK_BORDER,
  ROSTER_CARD_LIGHT_BG,
  ROSTER_CARD_LIGHT_BORDER,
} from "@/components/roster";
import CalendarCard from "@/components/summary/CalendarCard";
import { AnimatedTimeZoneToggle } from "@/components/ui/AnimatedTimeZoneToggle";
import SkyHeader from "@/components/ui/SkyHeader";
import { useAmendments } from "@/components/useAmendments";
import Colors from "@/constants/Colors";
import { db } from "@/db/db";
import {
  dataLoad,
  duties,
  groundDuties,
  GroundDuty,
  roster,
  Sector,
  sectors,
  Trip,
  trips,
} from "@/db/schema";
import { getTripDurationDays } from "@/lib/utils";
import { and, asc, eq, inArray } from "drizzle-orm";

import { DetailsGroundCard } from "./DetailsGroundCard";
import { DetailsTripCard } from "./DetailsTripCard";
import RosterUpdatesModal from "./RosterUpdatesModal";

/** One node on a trip’s pipe (flight or layover). Built in loadSummaryData. */
interface ItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  endDateStr?: string;
  layoverDurationHours?: number;
  data?: Sector & { actualReportTime?: string | null };
}

/**
 * FlatList row: either a trip (T) or ground duty (G).
 * Cards receive `tripData` / `groundData` and map them in sibling adapter files —
 * this shape stays Details-owned so load logic can evolve without changing roster/*.
 */
interface UnifiedTimelineRow {
  id: string;
  type: "T" | "G";
  startDate: string;
  tripData?: {
    tripMeta: Trip;
    routingSummary: string;
    timeline: ItineraryItem[];
    /** Zulu span used for calendar scroll / markers (sector dates). */
    calculatedStartDate: string;
    calculatedEndDate: string;
    trueLocalDurationDays: number;
    trueZuluDurationDays: number;
  };
  groundData?: GroundDuty & { creditAmount?: string | null };
}

type FilterType = "ALL" | "TRIPS" | "GROUND";

export default function DetailsSummaryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  // Shared across tabs via TimeModeZOrLProvider. Card formatting lives in
  // DetailsTripCard / DetailsGroundCard; duration math still runs in loadSummaryData.
  const { isZulu, toggleTimeMode } = useTimeModeZOrL();

  // TODO: extract shared themeColors builder (duplicated on History / Roster / Sectors).
  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      pageBg: isDark ? "#000000" : "#FFFFFF",
      calendarCardBg: isDark
        ? "rgba(28, 28, 30, 0.85)"
        : "rgba(242, 242, 247, 0.85)",
      // Shared roster card standard (white + grey border).
      cardBg: isDark ? ROSTER_CARD_DARK_BG : ROSTER_CARD_LIGHT_BG,
      nestedBoxBg: isDark ? "#3A3A3C" : "#FFFFFF",
      border: isDark ? ROSTER_CARD_DARK_BORDER : ROSTER_CARD_LIGHT_BORDER,
      accent: "#007AFF",
      timelinePipe: "#34C759",
      localTime: isDark ? Colors.dark.localTime : Colors.light.localTime,
      toggleBgActive: "#34C759",
      toggleBgInactive: isDark ? "#3A3A3C" : "#D1D1D6",
      toggleActivePill: isDark ? "#48484A" : "#FFFFFF",
    }),
    [isDark],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [timelineRows, setTimelineRows] = useState<UnifiedTimelineRow[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  // Accordion expand maps — keyed by tripNumber (T) or UnifiedTimelineRow.id (G).
  const [expandedTrips, setExpandedTrips] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedGroundDuties, setExpandedGroundDuties] = useState<{
    [key: string]: boolean;
  }>({});

  // DEV: fixed “today” for calendar + initial scroll. Swap to `new Date()` later.
  const todayAnchor = useMemo(() => new Date("2026-06-16T12:00:00"), []);
  const [selectedDate, setSelectedDate] = useState<Date>(todayAnchor);
  const [currentViewMonth, setCurrentViewMonth] = useState<Date>(todayAnchor);
  const [isMonthExpanded, setIsMonthExpanded] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  // Banner still needs the month-scoped amendment count; modal hydrates via useHistoryLogs.
  const { refreshAmendments } = useAmendments(currentViewMonth);

  // Calendar ↔ list sync: list scroll updates calendar; day tap scrolls list.
  // `isAutoScrolling` blocks viewability from fighting a programmatic scroll.
  const flatListRef = useRef<FlatList<UnifiedTimelineRow>>(null);
  const isAutoScrolling = useRef<boolean>(false);
  const hasInitiallySynced = useRef<boolean>(false);

  /** ALL / Trips / Ground segment control — filters the FlatList only. */
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

  const toggleGroundAccordion = (rowId: string) => {
    setExpandedGroundDuties((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  /** YYYY-MM-DD in the device’s local calendar (avoids UTC-only ISO surprises). */
  const getLocalDateString = useCallback((date: Date): string => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().split("T")[0];
  }, []);

  /**
   * Scroll FlatList so the first row covering `targetDate` is at the top.
   * Trips match if the date falls inside calculatedStart–End; ground matches startDate.
   */
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
        try {
          flatListRef.current.scrollToIndex({
            index: finalIndex,
            animated: true,
            viewPosition: 0,
          });
          setTimeout(() => {
            isAutoScrolling.current = false;
          }, 450);
        } catch (error) {
          isAutoScrolling.current = false;
        }
      }
    },
    [filteredTimelineRows, getLocalDateString],
  );

  /**
   * When the user scrolls the list, mirror the top visible row onto the calendar.
   * Skipped while `isAutoScrolling` so day-tap / initial sync don’t thrash state.
   */
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (
        isAutoScrolling.current ||
        viewableItems.length === 0 ||
        filteredTimelineRows.length === 0
      )
        return;

      const topVisibleItem = viewableItems[0].item as UnifiedTimelineRow;
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

  /**
   * Hydrate the chronological timeline from SQLite.
   *
   * Walks active `dataLoad` → ordered `roster` index nodes:
   * - type T + tripNumber → trip meta, sectors (+ duty report time), pipe timeline
   * - type G + groundDutyId → ground duty row (+ credit)
   *
   * Trip pipe construction (still Details-owned; UI can hide layovers via options):
   * 1. flights in dep order
   * 2. insert day gaps as layover stubs when consecutive deps are >1 day apart
   * 3. consolidate consecutive layover days into one block + rest-hour estimate
   * 4. compute Local/Zulu duration via `getTripDurationDays`
   */
  const loadSummaryData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Only manifests currently loaded into the app (not historical archives).
      const activeManifests = await db
        .select({ id: dataLoad.id })
        .from(dataLoad);
      if (activeManifests.length === 0) {
        setTimelineRows([]);
        setIsLoading(false);
        return;
      }

      const activeIds = activeManifests.map((m) => m.id);
      // Roster table is the chronological spine; each node points at T or G detail.
      const activeRosterTimeline = await db
        .select()
        .from(roster)
        .where(inArray(roster.dataLoadId, activeIds))
        .orderBy(asc(roster.startDate));

      const masterUnifiedRows: UnifiedTimelineRow[] = [];

      for (const indexNode of activeRosterTimeline) {
        // ── Trip node ──────────────────────────────────────────────────────
        if (indexNode.type === "T" && indexNode.tripNumber) {
          const tripTarget = await db
            .select()
            .from(trips)
            .where(eq(trips.tripNumber, indexNode.tripNumber))
            .limit(1);
          if (tripTarget.length === 0) continue;

          const currentTrip = tripTarget[0];

          // Sectors + report time from matching duty (join on trip+duty number).
          const tripSectors = await db
            .select({
              id: sectors.id,
              tripNumber: sectors.tripNumber,
              dutyNumber: sectors.dutyNumber,
              sectorNumber: sectors.sectorNumber,
              carrier: sectors.carrier,
              flightNumber: sectors.flightNumber,
              aircraftTypeSpecific: sectors.aircraftTypeSpecific,
              departureStation: sectors.departureStation,
              arrivalStation: sectors.arrivalStation,
              departureTime: sectors.departureTime,
              departureTimeLocal: sectors.departureTimeLocal,
              departureTimeShift: sectors.departureTimeShift,
              arrivalTime: sectors.arrivalTime,
              arrivalTimeLocal: sectors.arrivalTimeLocal,
              arrivalTimeShift: sectors.arrivalTimeShift,
              relativeDepartureDay: sectors.relativeDepartureDay,
              sectorType: sectors.sectorType,
              heavyCrewIdentifier: sectors.heavyCrewIdentifier,
              flyingHours: sectors.flyingHours,
              flyingHoursCredit: sectors.flyingHoursCredit,
              scheduleIndicator: sectors.scheduleIndicator,
              createdAt: sectors.createdAt,
              updatedAt: sectors.updatedAt,
              actualReportTime: duties.actualReportTime,
            })
            .from(sectors)
            .innerJoin(
              duties,
              and(
                eq(sectors.tripNumber, duties.tripNumber),
                eq(sectors.dutyNumber, duties.dutyNumber),
              ),
            )
            .where(eq(sectors.tripNumber, currentTrip.tripNumber))
            .orderBy(asc(sectors.departureTime), asc(sectors.sectorNumber));

          if (tripSectors.length === 0) continue;

          // Collapse consecutive identical stations → "LGW → JFK → LGW" style summary.
          const stations = [tripSectors[0].departureStation];
          tripSectors.forEach((s) => {
            if (stations[stations.length - 1] !== s.arrivalStation)
              stations.push(s.arrivalStation);
          });
          const routingSummary = stations.join(" → ");

          // Pass 1: flights + one layover stub per intervening calendar day.
          const rawTimeline: ItineraryItem[] = [];
          for (let i = 0; i < tripSectors.length; i++) {
            const currentSector = tripSectors[i];
            const currentLocDate = currentSector.departureTime.split("T")[0];
            rawTimeline.push({
              type: "flight",
              dateStr: currentLocDate,
              data: currentSector,
            });

            if (i < tripSectors.length - 1) {
              const nextSector = tripSectors[i + 1];
              const nextLocDate = nextSector.departureTime.split("T")[0];
              const currentDateObj = new Date(`${currentLocDate}T12:00:00`);
              const nextDateObj = new Date(`${nextLocDate}T12:00:00`);

              if (
                !isNaN(currentDateObj.getTime()) &&
                !isNaN(nextDateObj.getTime())
              ) {
                const diffDays = Math.ceil(
                  Math.abs(nextDateObj.getTime() - currentDateObj.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                // Same-day / overnight turn without a blank calendar day → no layover nodes.
                if (diffDays > 1) {
                  for (let d = 1; d < diffDays; d++) {
                    const layoverDate = new Date(currentDateObj);
                    layoverDate.setDate(currentDateObj.getDate() + d);
                    rawTimeline.push({
                      type: "layover",
                      dateStr: layoverDate.toISOString().split("T")[0],
                    });
                  }
                }
              }
            }
          }

          // Pass 2: merge consecutive layover days into one block; estimate rest hours
          // between previous flight dep and next flight’s report (rough heuristic).
          const consolidatedTimeline: ItineraryItem[] = [];
          let currentLayoverBlock: ItineraryItem | null = null;

          for (let i = 0; i < rawTimeline.length; i++) {
            const currentItem = rawTimeline[i];

            if (currentItem.type === "flight") {
              if (currentLayoverBlock) {
                const nextFlightItem = currentItem;
                const prevFlightItem =
                  consolidatedTimeline[consolidatedTimeline.length - 1];

                if (
                  prevFlightItem?.type === "flight" &&
                  prevFlightItem.data &&
                  nextFlightItem?.data
                ) {
                  const depDatePart =
                    nextFlightItem.data.departureTime.split("T")[0];
                  const repTimePart =
                    nextFlightItem.data.actualReportTime || "00:00";

                  const endRestObj = new Date(
                    `${depDatePart}T${repTimePart}:00`,
                  );
                  const startRestObj = new Date(
                    prevFlightItem.data.departureTime,
                  );

                  if (
                    !isNaN(startRestObj.getTime()) &&
                    !isNaN(endRestObj.getTime())
                  ) {
                    const diffMs =
                      endRestObj.getTime() - startRestObj.getTime();
                    currentLayoverBlock.layoverDurationHours = Math.max(
                      0,
                      Math.floor(diffMs / (1000 * 60 * 60)),
                    );
                  }
                }

                consolidatedTimeline.push(currentLayoverBlock);
                currentLayoverBlock = null;
              }
              consolidatedTimeline.push(currentItem);
            } else {
              if (!currentLayoverBlock) {
                currentLayoverBlock = {
                  type: "layover",
                  dateStr: currentItem.dateStr,
                  endDateStr: currentItem.dateStr,
                };
              } else {
                currentLayoverBlock.endDateStr = currentItem.dateStr;
              }
            }
          }

          if (currentLayoverBlock) {
            consolidatedTimeline.push(currentLayoverBlock);
          }

          // Local/Zulu duration: shift first dep / last arr by sector day-shift fields.
          const firstSector = tripSectors[0];
          const lastSector = tripSectors[tripSectors.length - 1];

          const baseStartZuluStr = rawTimeline[0].dateStr;
          const baseEndZuluStr = rawTimeline[rawTimeline.length - 1].dateStr;

          const startShiftDays = firstSector.departureTimeShift
            ? parseInt(firstSector.departureTimeShift, 10) || 0
            : 0;
          const endShiftDays = lastSector.arrivalTimeShift
            ? parseInt(lastSector.arrivalTimeShift, 10) || 0
            : 0;

          const startLocalObj = new Date(`${baseStartZuluStr}T12:00:00`);
          if (!isNaN(startLocalObj.getTime()) && startShiftDays !== 0) {
            startLocalObj.setDate(startLocalObj.getDate() + startShiftDays);
          }

          const endLocalObj = new Date(`${baseEndZuluStr}T12:00:00`);
          if (!isNaN(endLocalObj.getTime()) && endShiftDays !== 0) {
            endLocalObj.setDate(endLocalObj.getDate() + endShiftDays);
          }

          const localStartStr = startLocalObj.toISOString().split("T")[0];
          const localEndStr = endLocalObj.toISOString().split("T")[0];
          const calculatedLocalDuration = getTripDurationDays(
            localStartStr,
            localEndStr,
          );
          const calculatedZuluDuration = getTripDurationDays(
            baseStartZuluStr,
            baseEndZuluStr,
          );

          masterUnifiedRows.push({
            id: `TRIP_${currentTrip.tripNumber}`,
            type: "T",
            startDate: indexNode.startDate,
            tripData: {
              tripMeta: currentTrip,
              routingSummary,
              timeline: consolidatedTimeline,
              calculatedStartDate: baseStartZuluStr,
              calculatedEndDate: baseEndZuluStr,
              trueLocalDurationDays: calculatedLocalDuration,
              trueZuluDurationDays: calculatedZuluDuration,
            },
          });
        } else if (indexNode.type === "G" && indexNode.groundDutyId) {
          // ── Ground duty node ─────────────────────────────────────────────
          const groundTarget = await db
            .select()
            .from(groundDuties)
            .where(eq(groundDuties.id, indexNode.groundDutyId))
            .limit(1);

          if (groundTarget.length === 0) continue;

          masterUnifiedRows.push({
            id: `GROUND_${groundTarget[0].id}`,
            type: "G",
            startDate: indexNode.startDate,
            groundData: {
              ...groundTarget[0],
              creditAmount: groundTarget[0].creditAmount || null,
            },
          });
        }
      }

      setTimelineRows(masterUnifiedRows);
      refreshAmendments();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshAmendments]);

  // Reload whenever this tab gains focus (e.g. after import / returning from Settings).
  useFocusEffect(
    useCallback(() => {
      loadSummaryData();
    }, [loadSummaryData]),
  );

  // Re-scroll after filter changes once data is already loaded.
  useEffect(() => {
    if (!isLoading && filteredTimelineRows.length > 0) {
      const timer = setTimeout(() => {
        scrollToDateInList(selectedDate);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isLoading, filterType]);

  // One-shot: land the list on todayAnchor after the first successful load.
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

  /**
   * Calendar day dots: flight days (incl. multi-day layover span) vs ground.
   * Walks trip timelines so every intermediate date gets a “flight” marker.
   */
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

  // Week strip (Mon–Sun around currentViewMonth) vs 5-week month grid.
  const weeklyCalendarDays = useMemo(() => {
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
  }, [currentViewMonth]);

  const monthlyCalendarDays = useMemo(() => {
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
  }, [currentViewMonth]);

  const activeCalendarDays = isMonthExpanded
    ? monthlyCalendarDays
    : weeklyCalendarDays;

  /**
   * FlatList row renderer. Presentation only — DB shape stays here;
   * DetailsTripCard / DetailsGroundCard map into shared roster VMs.
   */
  const renderTimelineItem = useCallback(
    ({ item }: { item: UnifiedTimelineRow }) => {
      if (item.type === "T" && item.tripData) {
        const rotation = item.tripData;
        const tripNumber = rotation.tripMeta.tripNumber;
        return (
          <DetailsTripCard
            tripData={rotation}
            themeColors={themeColors}
            isExpanded={!!expandedTrips[tripNumber]}
            onToggle={() => toggleTripAccordion(tripNumber)}
            // Sector chevron → Sectors tab (History does not pass this).
            onPressSector={(params) =>
              router.push({
                pathname: "/(tabs)/(sectors)",
                params: {
                  tripNumber: params.tripNumber,
                  startDate: params.startDate,
                  endDate: params.endDate,
                  routing: params.routing,
                } as Record<string, string>,
              })
            }
          />
        );
      }

      if (item.type === "G" && item.groundData) {
        return (
          <DetailsGroundCard
            groundData={item.groundData}
            themeColors={themeColors}
            isExpanded={!!expandedGroundDuties[item.id]}
            onToggle={() => toggleGroundAccordion(item.id)}
          />
        );
      }
      return null;
    },
    [expandedTrips, expandedGroundDuties, themeColors, router],
  );

  // ── Render hierarchy ───────────────────────────────────────────────────────
  // SkyHeader → Header → CalendarCard → amendment banner → filter/L-Z → list → modal
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.pageBg }]}
    >
      <SkyHeader
        height={190}
        showClouds={true}
        style={styles.absoluteSkyPosition}
      />
      <Header onImportSuccess={loadSummaryData} />

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
          if (isMonthExpanded)
            newDate.setMonth(
              currentViewMonth.getMonth() + (dir === "next" ? 1 : -1),
            );
          else
            newDate.setDate(
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

      {/* Opens RosterUpdatesModal — History-style cards for the viewed month. */}
      <RosterAmendmentBanner
        viewingDate={currentViewMonth}
        onPress={() => setIsModalOpen(true)}
      />

      {/* ALL / Trips / Ground + Local↔Zulu toggle */}
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
            ></Text>
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

            <AnimatedTimeZoneToggle
              isZulu={isZulu}
              onToggle={toggleTimeMode}
              activeBg={themeColors.toggleBgActive}
              inactiveBg={themeColors.toggleBgInactive}
            />
          </View>
        </View>
      </View>

      {/* Chronological trip / ground list — synced with calendar via refs above. */}
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
          const waitTimer = setTimeout(() => {
            if (flatListRef.current && filteredTimelineRows.length > 0) {
              flatListRef.current.scrollToIndex({
                index: Math.min(info.index, filteredTimelineRows.length - 1),
                animated: true,
                viewPosition: 0,
              });
            }
          }, 80);
          return () => clearTimeout(waitTimer);
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

      <RosterUpdatesModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewingMonth={currentViewMonth}
      />
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

  // Segmented Control Styles
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
  emptyComponentBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
});
