import { HotelCard } from "@/components/HotelCard";
import { StationIataBadge } from "@/components/ui/StationIataBadge";
import type { Hotel } from "@/db/schema";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { MatchedAirport } from "./useHotelsByIata";

export type HotelsPanelTheme = {
  textColor: string;
  subTextColor: string;
  accent: string;
  emptyBg: string;
  border: string;
  heroBg?: string;
  chipBg?: string;
  isDark?: boolean;
};

type Props = {
  searchCode: string;
  foundHotels: Hotel[];
  matchedAirport: MatchedAirport | null;
  loading: boolean;
  hasSearched: boolean;
  themeColors: HotelsPanelTheme;
  contentStyle?: ViewStyle;
};

export function HotelsByStationPanel({
  searchCode,
  foundHotels,
  matchedAirport,
  loading,
  hasSearched,
  themeColors,
  contentStyle,
}: Props) {
  if (loading) {
    return (
      <ActivityIndicator
        size="small"
        color={themeColors.accent}
        style={[styles.loader, contentStyle]}
      />
    );
  }

  if (!hasSearched) {
    return null;
  }

  const code = searchCode.toUpperCase();
  const heroBg =
    themeColors.heroBg ??
    (themeColors.isDark
      ? "rgba(0, 122, 255, 0.16)"
      : "rgba(0, 122, 255, 0.08)");
  const emptyBg = themeColors.chipBg ?? themeColors.emptyBg;

  return (
    <View style={[styles.panel, contentStyle]}>
      {matchedAirport ? (
        <View
          style={[
            styles.stationCard,
            {
              backgroundColor: heroBg,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.stationHeader}>
            <Text
              style={[styles.stationName, { color: themeColors.textColor }]}
              numberOfLines={2}
            >
              {matchedAirport.name}
            </Text>
            <StationIataBadge code={code} />
          </View>
          {matchedAirport.country ? (
            <View style={styles.stationLocationRow}>
              <FontAwesome6
                name="location-dot"
                size={12}
                color={themeColors.accent}
                style={{ marginRight: 6, marginTop: 2 }}
              />
              <Text
                style={[
                  styles.stationLocation,
                  { color: themeColors.subTextColor },
                ]}
              >
                {matchedAirport.country}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.sectionLabel, { color: themeColors.subTextColor }]}>
        {foundHotels.length === 1
          ? "1 hotel"
          : `${foundHotels.length} hotels`}
      </Text>

      {foundHotels.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: emptyBg,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.slashedIconWrap}>
            <Ionicons
              name="bed-outline"
              size={24}
              color={themeColors.subTextColor}
            />
            <View
              style={[
                styles.iconSlash,
                { backgroundColor: themeColors.subTextColor },
              ]}
            />
          </View>
          <Text style={[styles.emptyText, { color: themeColors.subTextColor }]}>
            No crew hotels found for “{code}”.
          </Text>
        </View>
      ) : (
        foundHotels.map((hotel, index) => (
          <HotelCard key={`hotel-${hotel.id || index}`} hotel={hotel} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "transparent",
  },
  loader: { marginVertical: 10 },
  stationCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  stationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  stationName: {
    flex: 1,
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
    lineHeight: 22,
    marginRight: 6,
  },
  stationLocationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  stationLocation: {
    flex: 1,
    fontFamily: "GoogleSans",
    fontSize: 14,
  },
  sectionLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  emptyCard: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  slashedIconWrap: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  iconSlash: {
    position: "absolute",
    width: 30,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: "-28deg" }],
  },
  emptyText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    textAlign: "center",
  },
});
