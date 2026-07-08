/**
 * DetailsTripCard
 *
 * Thin wrapper: maps Details trip payload → TripDetailVM, then paints with
 * shared `RosterCardShell` + `TripHeaderSummary` + `TripTimelinePipe`.
 *
 * Details-specific options (vs History):
 * - duration days beside the expand chevron
 * - flights-only pipe (`showLayovers: false`)
 * - sector disclosure chevron → parent `onPressSector` → Sectors tab
 * - Local dep/arr (+ report clock) green via `timeMode` / `Colors.localTime`
 *
 * Adapter: `./mapDetailsToRosterVM` → `mapDetailsTripToDetailVM`.
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `tripData` | Details trip payload | from UnifiedTimelineRow.tripData |
 * | `themeColors` | roster-compatible theme | cardBg / border / accent / localTime / … |
 * | `isExpanded` | `boolean` | accordion state (owned by index.tsx) |
 * | `onToggle` | `() => void` | expand/collapse |
 * | `onPressSector` | `(SectorNavParams) => void` | parent calls router.push |
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

import { Text, View } from "@/components/Themed";
import { useTimeModeZOrL } from "@/components/TimeModeZOrL";
import {
  RosterCardShell,
  TripHeaderSummary,
  TripTimelinePipe,
} from "@/components/roster";
import type { SectorNavParams } from "@/components/roster";
import { useFlightTimeFormatter } from "@/components/useFlightTimeFormatter";
import { formatTripDurationLabel } from "@/lib/utils";
import {
  DetailsTripData,
  mapDetailsTripToDetailVM,
} from "./mapDetailsToRosterVM";

interface ThemeColors {
  textColor: string;
  subTextColor: string;
  cardBg: string;
  border: string;
  accent: string;
  timelinePipe: string;
  localTime: string;
}

interface Props {
  tripData: DetailsTripData;
  themeColors: ThemeColors;
  isExpanded: boolean;
  onToggle: () => void;
  onPressSector: (params: SectorNavParams) => void;
}

export function DetailsTripCard({
  tripData,
  themeColors,
  isExpanded,
  onToggle,
  onPressSector,
}: Props) {
  const { isZulu } = useTimeModeZOrL();
  const { getFlightDisplayDetails, formatCardHeaderDate } =
    useFlightTimeFormatter();

  const tripVM = useMemo(
    () =>
      mapDetailsTripToDetailVM(
        tripData,
        formatCardHeaderDate,
        getFlightDisplayDetails,
        isZulu,
      ),
    [tripData, formatCardHeaderDate, getFlightDisplayDetails, isZulu],
  );

  const durationDays = tripVM.header.durationDays;

  return (
    <RosterCardShell themeColors={themeColors}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "transparent",
          width: "100%",
        }}
      >
        <TripHeaderSummary
          header={tripVM.header}
          themeColors={themeColors}
          options={
            {
              // Duration is rendered beside the chevron (Details layout), not under routing.
            }
          }
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
            marginLeft: 12,
          }}
        >
          {durationDays != null ? (
            <Text
              style={{
                fontFamily: "GoogleSansBold",
                fontSize: 13,
                color: themeColors.subTextColor,
                marginRight: 10,
              }}
            >
              {formatTripDurationLabel(durationDays)}
            </Text>
          ) : null}
          <FontAwesome6
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={themeColors.subTextColor}
          />
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <Animated.View
          entering={FadeInUp.duration(250)}
          exiting={FadeOutDown.duration(200)}
          style={{
            backgroundColor: "transparent",
            marginTop: 0,
            width: "100%",
          }}
        >
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: themeColors.border,
              marginBottom: 10,
              marginTop: 8,
              opacity: 0.15,
            }}
          />

          <TripTimelinePipe
            items={tripVM.timeline}
            themeColors={themeColors}
            header={tripVM.header}
            options={{
              timeMode: isZulu ? "zulu" : "local",
              // Match previous Details behaviour: flights only.
              showLayovers: false,
              showReportTime: true,
              showSectorChevron: true,
              onPressSector,
              locationDisplayMode: "code",
            }}
          />
        </Animated.View>
      ) : null}
    </RosterCardShell>
  );
}
