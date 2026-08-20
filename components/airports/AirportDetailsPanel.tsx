/**
 * AirportDetailsPanel
 *
 * Shared airport reference UI used by AirportModal (Sectors) and the Tools
 * Airports lookup screen. Presentational only — parent supplies the IATA.
 */

import {
  formatAirportCountryDisplay,
  getAirportByIataCode,
  type AirportLookupResult,
} from "@/db/airport-queries";
import { Text, View } from "@/components/Themed";
import { StationIataBadge } from "@/components/ui/StationIataBadge";
import { FontAwesome6 } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";

export type AirportDetailsTheme = {
  textColor: string;
  subTextColor: string;
  border: string;
  accent: string;
  heroBg: string;
  chipBg: string;
};

type Props = {
  stationCode: string;
  themeColors: AirportDetailsTheme;
  /** When false, hide the empty state (parent shows its own idle UI). */
  showEmpty?: boolean;
};

export function resolveAirport(stationCode: string): AirportLookupResult | null {
  if (!stationCode?.trim()) return null;
  return getAirportByIataCode(stationCode)[0] ?? null;
}

export function AirportDetailsPanel({
  stationCode,
  themeColors,
  showEmpty = true,
}: Props) {
  const code = stationCode.trim().toUpperCase();

  const airport = useMemo(() => resolveAirport(code), [code]);

  const countryLabel = formatAirportCountryDisplay(
    airport?.isoCountry ?? airport?.country ?? null,
  );

  const metaChips = airport
    ? [
        airport.icao ? { label: "ICAO", value: airport.icao } : null,
        airport.tz ? { label: "Timezone", value: airport.tz } : null,
        airport.elevation != null
          ? { label: "Elevation", value: `${airport.elevation} ft` }
          : null,
        airport.latitude != null && airport.longitude != null
          ? {
              label: "Coordinates",
              value: `${Number(airport.latitude).toFixed(3)}°, ${Number(airport.longitude).toFixed(3)}°`,
            }
          : null,
      ].filter(Boolean) as { label: string; value: string }[]
    : [];

  if (!airport) {
    if (!showEmpty || !code) return null;
    return (
      <View
        style={[
          styles.emptyCard,
          {
            backgroundColor: themeColors.chipBg,
            borderColor: themeColors.border,
          },
        ]}
      >
        <FontAwesome6
          name="plane-slash"
          size={22}
          color={themeColors.subTextColor}
          style={{ marginBottom: 10 }}
        />
        <Text style={[styles.emptyText, { color: themeColors.subTextColor }]}>
          No airport details found for “{code}”.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: themeColors.heroBg,
            borderColor: themeColors.border,
          },
        ]}
      >
        <View style={styles.heroHeaderRow}>
          <Text style={[styles.heroName, { color: themeColors.textColor }]}>
            {airport.name}
          </Text>
          <StationIataBadge code={code} />
        </View>

        {countryLabel || airport.city ? (
          <View style={styles.heroLocationRow}>
            <FontAwesome6
              name="location-dot"
              size={12}
              color={themeColors.accent}
              style={{ marginRight: 6, marginTop: 2 }}
            />
            <Text
              style={[
                styles.heroLocationText,
                { color: themeColors.subTextColor },
              ]}
            >
              {[airport.city, countryLabel].filter(Boolean).join(", ")}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.sectionLabel, { color: themeColors.subTextColor }]}>
        Details
      </Text>

      <View style={styles.chipGrid}>
        {metaChips.map((chip) => (
          <View
            key={chip.label}
            style={[
              styles.chip,
              {
                backgroundColor: themeColors.chipBg,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text
              style={[styles.chipLabel, { color: themeColors.subTextColor }]}
            >
              {chip.label}
            </Text>
            <Text
              style={[styles.chipValue, { color: themeColors.textColor }]}
              numberOfLines={2}
            >
              {chip.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "transparent",
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "transparent",
    gap: 8,
  },
  heroName: {
    flex: 1,
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
    lineHeight: 22,
    marginRight: 6,
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "transparent",
    marginTop: 8,
  },
  heroLocationText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    flex: 1,
  },
  sectionLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: "transparent",
  },
  chip: {
    width: "47.5%",
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: "45%",
  },
  chipLabel: {
    fontFamily: "GoogleSans",
    fontSize: 11,
    marginBottom: 4,
  },
  chipValue: {
    fontFamily: "GoogleSansBold",
    fontSize: 14,
    letterSpacing: -0.1,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    textAlign: "center",
  },
});
