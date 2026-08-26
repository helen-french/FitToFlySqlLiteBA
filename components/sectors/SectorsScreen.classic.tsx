/**
 * Sectors screen — classic layout (pre-immersive map).
 *
 * Preserved snapshot from commit cda8468. Not wired by default; flip
 * `USE_IMMERSIVE_SECTORS_MAP` in `sectorsMapLayout.ts` to restore this version.
 *
 * Orchestration: map banner, prev/next (left), Local/Zulu (right).
 * DB hydration: `useSectorsTrip`. Trip header + pipe: shared `components/roster/*`
 * via `mapSectorsToRosterVM` (Phase 2). Crew pill/handler kept commented for later.
 */

import AirportModal from "@/components/modals/AirportModal";
import CreditModal from "@/components/modals/CreditModal";
import HotelModal from "@/components/modals/HotelModal";
import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { useTimeModeZOrL } from "@/components/TimeModeZOrL";
import {
  ROSTER_CARD_DARK_BG,
  TripHeaderAccordion,
  TripTimelinePipe,
} from "@/components/roster";
import { AnimatedTimeZoneToggle } from "@/components/ui/AnimatedTimeZoneToggle";
import { EmptyStatePanel } from "@/components/ui/EmptyStatePanel";
import { RecordArrowStepper } from "@/components/ui/RecordArrowStepper";
import { useStepperTheme } from "@/components/ui/stepperTheme";
import { useFlightTimeFormatter } from "@/components/useFlightTimeFormatter";
import { useSectorsTrip } from "@/components/useSectorsTrip";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeInLeft,
  FadeInRight,
  LinearTransition,
} from "react-native-reanimated";

import Colors from "@/constants/Colors";

import { mapSectorsTripToDetailVM } from "@/components/sectors/mapSectorsToRosterVM";

export default function SectorsScreenClassic() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

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
  const [crewLoading, setCrewLoading] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<
    "left" | "right"
  >("right");
  const [hotelModalStation, setHotelModalStation] = useState<string | null>(
    null,
  );
  const [airportModalStation, setAirportModalStation] = useState<string | null>(
    null,
  );
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
    loadTripCrew,
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

  /** First destination airport on the trip (e.g. YVR, CUN). */
  const firstDestinationIata = useMemo(() => {
    const firstFlight = tripVM?.timeline.find((item) => item.kind === "flight");
    return firstFlight?.arrivalCode?.trim().toUpperCase() || null;
  }, [tripVM]);

  const handleOpenLocationNotes = () => {
    if (!firstDestinationIata) return;
    router.push({
      pathname: "/(tabs)/(sectors)/notes",
      params: { stationCode: firstDestinationIata, category: "ALL" },
    });
  };

  const handleViewTripCrew = async () => {
    if (!activeTrip?.tripNumber) return;
    try {
      setCrewLoading(true);
      const assignedRosterCrew = await loadTripCrew();

      if (assignedRosterCrew.length === 0) {
        Alert.alert(
          "Roster Crew",
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
        `Roster Crew (${activeTrip.tripNumber})`,
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

  const handleNavigateToTrip = (
    nextTargetId: string,
    direction: "left" | "right",
  ) => {
    setAnimationDirection(direction);
    setCurrentTripNumber(nextTargetId);
  };

  const stepperTheme = useStepperTheme();

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
          {/* Prev/next left; Local/Zulu right. */}
          <View style={styles.headerControlStripRow}>
            <RecordArrowStepper
              canGoPrev={!!prevTripNumber}
              canGoNext={!!nextTripNumber}
              onPrev={() => handleNavigateToTrip(prevTripNumber!, "left")}
              onNext={() => handleNavigateToTrip(nextTripNumber!, "right")}
              theme={stepperTheme}
            />

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
                <TripHeaderAccordion
                  header={tripVM.header}
                  themeColors={themeColors}
                  onPressAirportCode={setAirportModalStation}
                  onPressCredit={() => setCreditModalOpen(true)}
                  onPressLocation={
                    firstDestinationIata ? handleOpenLocationNotes : undefined
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
                  locationDisplayMode: "code",
                  showHotelAction: true,
                  onPressHotel: (stationCode) => {
                    setHotelModalStation(stationCode);
                  },
                  showCrewAction: true,
                  onPressCrew: handleViewTripCrew,
                  crewLoading,
                  showMaxFdpAction: true,
                }}
              />
            ) : null}
          </Animated.View>
        </View>
      )}

      {!loading && !activeTrip && (
        <EmptyStatePanel
          textColor={themeColors.textColor}
          subTextColor={themeColors.subTextColor}
          contentStyle={{ paddingTop: 30 }}
        />
      )}
      <HotelModal
        visible={hotelModalStation !== null}
        stationCode={hotelModalStation}
        onClose={() => setHotelModalStation(null)}
      />
      <AirportModal
        visible={airportModalStation !== null}
        stationCode={airportModalStation}
        onClose={() => setAirportModalStation(null)}
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
  tripMetaBlock: {
    backgroundColor: "transparent",
    width: "100%",
    marginBottom: 36,
  },
});
