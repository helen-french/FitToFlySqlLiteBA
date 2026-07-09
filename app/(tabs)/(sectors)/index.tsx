/**
 * Sectors screen
 *
 * Orchestration: map banner, prev/next (left), Local/Zulu (right).
 * DB hydration: `useSectorsTrip`. Trip header + pipe: shared `components/roster/*`
 * via `mapSectorsToRosterVM` (Phase 2). Crew pill/handler kept commented for later.
 */

import CreditModal from "@/components/modals/CreditModal";
import HotelModal from "@/components/modals/HotelModal";
import NotesModal from "@/components/modals/NotesModal";
import type { NoteCategory } from "@/components/notes/noteCategory";
import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { useTimeModeZOrL } from "@/components/TimeModeZOrL";
import {
  ROSTER_CARD_DARK_BG,
  TripHeaderSummary,
  TripTimelinePipe,
} from "@/components/roster";
import { AnimatedTimeZoneToggle } from "@/components/ui/AnimatedTimeZoneToggle";
import { useFlightTimeFormatter } from "@/components/useFlightTimeFormatter";
import { useSectorsTrip } from "@/components/useSectorsTrip";
import { FontAwesome6 } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  // Alert, // restore with handleViewTripCrew
  Image,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeInLeft,
  FadeInRight,
  LinearTransition,
} from "react-native-reanimated";

import Colors from "@/constants/Colors";
import { formatTripDurationLabel } from "@/lib/utils";

import { mapSectorsTripToDetailVM } from "./mapSectorsToRosterVM";

export default function SectorsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const params = useLocalSearchParams<{
    tripNumber?: string;
    startDate?: string;
    endDate?: string;
    routing?: string;
  }>();

  const { isZulu, toggleTimeMode } = useTimeModeZOrL();
  const { getFlightDisplayDetails, formatCardHeaderDate } =
    useFlightTimeFormatter();

  const [currentTripNumber, setCurrentTripNumber] = useState<string | null>(
    null,
  );
  // Kept for when Crew returns to the control strip:
  // const [crewLoading, setCrewLoading] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<
    "left" | "right"
  >("right");
  const [hotelModalStation, setHotelModalStation] = useState<string | null>(
    null,
  );
  const [notesModal, setNotesModal] = useState<{
    stationCode: string;
    category: NoteCategory;
  } | null>(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);

  // Sync deep-link / Details sector chevron into local trip pointer.
  useEffect(() => {
    if (params.tripNumber) {
      setCurrentTripNumber(params.tripNumber);
    }
  }, [params.tripNumber]);

  const {
    activeTrip,
    itineraryTimeline,
    isLoading: loading,
    prevTripNumber,
    nextTripNumber,
    reload,
    // loadTripCrew, // restore with Crew button below
  } = useSectorsTrip(currentTripNumber, setCurrentTripNumber, {
    tripNumber: params.tripNumber,
    startDate: params.startDate,
    endDate: params.endDate,
    routing: params.routing,
  });

  const tripVM = useMemo(() => {
    if (!activeTrip) return null;
    return mapSectorsTripToDetailVM(
      activeTrip,
      itineraryTimeline,
      formatCardHeaderDate,
      getFlightDisplayDetails,
      isZulu,
    );
  }, [
    activeTrip,
    itineraryTimeline,
    formatCardHeaderDate,
    getFlightDisplayDetails,
    isZulu,
  ]);

  /*
  // ── Crew alert (hidden from strip for now; restore with Crew pill) ────────
  const handleViewTripCrew = async () => {
    if (!activeTrip?.tripNumber) return;
    try {
      setCrewLoading(true);
      const assignedRosterCrew = await loadTripCrew();

      if (assignedRosterCrew.length === 0) {
        Alert.alert(
          "✈️ Roster Crew",
          `No operating crew records found logged for Trip (${activeTrip.tripNumber}).`,
        );
        return;
      }

      const formattedCrewStrings = assignedRosterCrew.map((c) => {
        const rolePrefix =
          c.crewFunction === 11
            ? "Capt"
            : c.crewFunction === 12
              ? "FO"
              : "Crew";
        return `${rolePrefix} ${c.initials} ${c.surname}`;
      });

      Alert.alert(
        `✈️ Roster Crew (${activeTrip.tripNumber})`,
        formattedCrewStrings.join("\n"),
      );
    } catch (err) {
      console.error(
        "Failed querying trip roster assigned crew manifests:",
        err,
      );
    } finally {
      setCrewLoading(false);
    }
  };
  */

  const handleNavigateToTrip = (
    nextTargetId: string,
    direction: "left" | "right",
  ) => {
    setAnimationDirection(direction);
    setCurrentTripNumber(nextTargetId);
  };

  const themeColors = {
    textColor: isDark ? "#FFFFFF" : "#1A1A1A",
    subTextColor: isDark ? "#A0A0A0" : "#666666",
    accent: "#007AFF",
    border: isDark ? "rgba(56, 56, 58, 0.4)" : "rgba(229, 229, 234, 0.6)",
    nestedBoxBg: isDark ? "#2C2C2E" : "#FFFFFF",
    // Pipe node fills (behind circles) — shared roster white/dark elevated.
    cardBg: isDark ? ROSTER_CARD_DARK_BG : "#FFFFFF",
    // Map / light chrome fill (previous Sectors page grey).
    mapBg: isDark ? ROSTER_CARD_DARK_BG : "#F2F2F7",
    timelinePipe: "#34C759",
    localTime: isDark ? Colors.dark.localTime : Colors.light.localTime,
    toggleBgActive: "#34C759",
    toggleBgInactive: isDark ? "#3A3A3C" : "#D1D1D6",
    disabledBtn: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
  };

  return (
    <TabScreenLayout onRefresh={reload}>
      {/* MAP BANNER FRAME */}
      <View
        style={[styles.mapContainer, { backgroundColor: themeColors.mapBg }]}
      >
        <Image
          source={require("@/assets/images/LGWToMCO.png")}
          style={styles.mapImage}
          resizeMode="cover"
        />
      </View>

      {loading && !activeTrip && (
        <ActivityIndicator
          size="small"
          color={themeColors.accent}
          style={{ marginVertical: 40 }}
        />
      )}

      {activeTrip && (
        <View style={styles.activeContentContainer}>
          {/* Prev/next left; Local/Zulu right. Crew pill commented out (kept below). */}
          <View style={styles.headerControlStripRow}>
            <View
              style={[
                styles.stepperContainerRow,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.nestedBoxBg,
                },
              ]}
            >
              <TouchableOpacity
                disabled={!prevTripNumber}
                onPress={() => handleNavigateToTrip(prevTripNumber!, "left")}
                style={[
                  styles.stepActionBtn,
                  !prevTripNumber && {
                    backgroundColor: themeColors.disabledBtn,
                  },
                  {
                    borderRightWidth: 1,
                    borderRightColor: themeColors.border,
                  },
                ]}
              >
                <FontAwesome6
                  name="chevron-left"
                  size={12}
                  color={prevTripNumber ? themeColors.accent : "#8E8E93"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!nextTripNumber}
                onPress={() => handleNavigateToTrip(nextTripNumber!, "right")}
                style={[
                  styles.stepActionBtn,
                  !nextTripNumber && {
                    backgroundColor: themeColors.disabledBtn,
                  },
                ]}
              >
                <FontAwesome6
                  name="chevron-right"
                  size={12}
                  color={nextTripNumber ? themeColors.accent : "#8E8E93"}
                />
              </TouchableOpacity>
            </View>

            {/*
            // ── Crew pill (hidden for now) ──────────────────────────────────
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={crewLoading}
              onPress={handleViewTripCrew}
              style={[
                styles.utilityPillButton,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.nestedBoxBg,
                  marginRight: 12,
                },
              ]}
            >
              {crewLoading ? (
                <ActivityIndicator
                  size="small"
                  color={themeColors.accent}
                  style={{ marginRight: 4 }}
                />
              ) : (
                <FontAwesome6
                  name="users"
                  size={11}
                  color={themeColors.accent}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                style={[
                  styles.utilityPillText,
                  { color: themeColors.textColor },
                ]}
              >
                Crew
              </Text>
            </TouchableOpacity>
            */}

            <View style={styles.timeModeCluster}>
              <Text
                style={[
                  styles.timeModeLabel,
                  { color: themeColors.textColor },
                ]}
              >
                {isZulu ? "Zulu" : "Local"}
              </Text>
              <AnimatedTimeZoneToggle
                isZulu={isZulu}
                onToggle={toggleTimeMode}
                activeBg={themeColors.toggleBgActive}
                inactiveBg={themeColors.toggleBgInactive}
              />
            </View>
          </View>

          {/* STABLE ANIMATED ENTRY PANEL */}
          <Animated.View
            key={activeTrip.tripNumber}
            entering={
              animationDirection === "right"
                ? FadeInRight.duration(150)
                : FadeInLeft.duration(150)
            }
            layout={LinearTransition.duration(150)}
            style={{ width: "100%", backgroundColor: "transparent" }}
          >
            {/* Shared roster header + pipe (layovers on; names on; Local/Zulu via provider). */}
            {tripVM ? (
              <View style={styles.tripMetaBlock}>
                <TripHeaderSummary
                  header={tripVM.header}
                  themeColors={themeColors}
                  options={{
                    showTotalFlyingHours: true,
                    // Duration sits in trailing slot (previous Sectors layout).
                  }}
                  showCreditAction
                  onPressCredit={() => setCreditModalOpen(true)}
                  trailing={
                    tripVM.header.durationDays != null ? (
                      <Text
                        style={{
                          fontFamily: "GoogleSansBold",
                          fontSize: 13,
                          color: themeColors.subTextColor,
                        }}
                      >
                        {formatTripDurationLabel(tripVM.header.durationDays)}
                      </Text>
                    ) : null
                  }
                />
              </View>
            ) : null}

            {tripVM && tripVM.timeline.length > 0 ? (
              <TripTimelinePipe
                items={tripVM.timeline}
                themeColors={themeColors}
                header={tripVM.header}
                options={{
                  timeMode: isZulu ? "zulu" : "local",
                  showLayovers: true,
                  showReportTime: true,
                  showFlyingHours: true,
                  showSectorChevron: false,
                  locationDisplayMode: "nameAndCode",
                  // Turnaround Hotel / Notes → Location / Notes (Enroute)
                  // for prev flight’s arrival IATA.
                  showHotelAction: true,
                  onPressHotel: (stationCode) => {
                    setHotelModalStation(stationCode);
                  },
                  showNotesAction: true,
                  onPressNotes: (stationCode) => {
                    setNotesModal({ stationCode, category: "E" });
                  },
                  showFlightNotesActions: true,
                  onPressDepartureNotes: (stationCode) => {
                    setNotesModal({ stationCode, category: "D" });
                  },
                  onPressArrivalNotes: (stationCode) => {
                    setNotesModal({ stationCode, category: "A" });
                  },
                }}
              />
            ) : null}
          </Animated.View>
        </View>
      )}

      {!loading && !activeTrip && (
        <View style={styles.centerContent}>
          <FontAwesome6
            name="plane-slash"
            size={32}
            color={themeColors.subTextColor}
            style={{ marginBottom: 12 }}
          />
          <Text
            style={[styles.placeholderTitle, { color: themeColors.textColor }]}
          >
            No Active Duties
          </Text>
          <Text style={[styles.subText, { color: themeColors.subTextColor }]}>
            There are no historical, current, or upcoming trips logged in your
            database roster manifest.
          </Text>
        </View>
      )}
      <HotelModal
        visible={hotelModalStation !== null}
        stationCode={hotelModalStation}
        onClose={() => setHotelModalStation(null)}
      />
      <NotesModal
        visible={notesModal !== null}
        stationCode={notesModal?.stationCode ?? null}
        category={notesModal?.category ?? null}
        onClose={() => setNotesModal(null)}
      />
      <CreditModal
        visible={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
      />
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    height: 180,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 20,
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  centerContent: {
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 24,
  },
  activeContentContainer: {
    backgroundColor: "transparent",
    width: "100%",
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerControlStripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 20,
    width: "100%",
  },
  timeModeCluster: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    gap: 8,
  },
  timeModeLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
    width: 42,
  },
  utilityPillButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
  },
  utilityPillText: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
  },
  stepperContainerRow: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    height: 32,
  },
  stepActionBtn: {
    width: 38,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tripMetaBlock: {
    backgroundColor: "transparent",
    width: "100%",
    marginBottom: 24,
  },
  placeholderTitle: {
    fontFamily: "GoogleSansBold",
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
