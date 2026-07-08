/**
 * TripTimelinePipe
 *
 * Master "pipe layout" used by History (and later Details / Sectors).
 * Renders the vertical green spine + flight/layover nodes.
 *
 * Filtering (e.g. flights-only vs include layovers) is controlled via
 * TripDisplayOptions.showLayovers so each screen can pass different flags
 * without forking the layout code.
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `items` | `TimelineItemVM[]` | flight + layover nodes |
 * | `themeColors` | `RosterThemeColors` | includes `timelinePipe` green |
 * | `options?` | `TripDisplayOptions` | feature flags (see below) |
 * | `header?` | `TripHeaderVM` | needed when `showSectorChevron` builds nav params |
 *
 * ### Useful `options` for this component
 * - `showLayovers?` — default `true` (show Turnaround nodes); pass `false` for flights-only (History)
 * - `showReportTime?` — report time on flight rows
 * - `showFlyingHours?` — per-sector flying hours
 * - `showTurnaround?` — reserved, not implemented yet
 * - `showSectorChevron?` + `onPressSector?` — disclosure → Sectors tab
 * - `locationDisplayMode?` — `"code"` (default) or parked `"nameAndCode"`
 *
 * **Note:** Pipe node icons always use theme `accent` blue. Do not pass
 * `iconColor` expecting pipe icons to change — that flag is for the trip
 * **header** plane only (`TripHeaderSummary`).
 */

import React, { useMemo } from "react";

import { View } from "@/components/Themed";
import { TimelineFlightRow } from "@/components/roster/TimelineFlightRow";
import { TimelineLayoverRow } from "@/components/roster/TimelineLayoverRow";
import { rosterStyles as styles } from "@/components/roster/rosterStyles";
import {
  RosterThemeColors,
  SectorNavParams,
  TimelineItemVM,
  TripDisplayOptions,
  TripHeaderVM,
} from "@/components/roster/types";

interface Props {
  items: TimelineItemVM[];
  themeColors: RosterThemeColors;
  options?: TripDisplayOptions;
  /**
   * When showSectorChevron is on, each flight row receives the same
   * SectorNavParams derived from the trip header (tripNumber / dates / routing).
   */
  header?: TripHeaderVM;
}

export function TripTimelinePipe({
  items,
  themeColors,
  options = {},
  header,
}: Props) {
  // Default: show layovers (History / Sectors). Details can pass showLayovers=false.
  const showLayovers = options.showLayovers !== false;

  const visibleItems = useMemo(
    () =>
      showLayovers ? items : items.filter((item) => item.kind === "flight"),
    [items, showLayovers],
  );

  // Built once for all chevrons on this trip.
  const sectorNavParams: SectorNavParams | undefined = header
    ? {
        tripNumber: header.tripNumber,
        startDate: header.startDateRaw,
        endDate: header.endDateRaw,
        routing: header.routingSummary,
      }
    : undefined;

  return (
    <View style={styles.pipelineWrapper}>
      <View
        style={[
          styles.verticalTimelinePipe,
          { backgroundColor: themeColors.timelinePipe },
        ]}
      />

      <View style={styles.rowsWrapperBlock}>
        {visibleItems.map((item) =>
          item.kind === "flight" ? (
            <TimelineFlightRow
              key={item.id}
              item={item}
              themeColors={themeColors}
              options={options}
              sectorNavParams={sectorNavParams}
            />
          ) : (
            <TimelineLayoverRow
              key={item.id}
              item={item}
              themeColors={themeColors}
              options={options}
            />
          ),
        )}
      </View>
    </View>
  );
}
