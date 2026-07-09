import { HotelCard } from "@/components/HotelCard";
import type { Hotel } from "@/db/schema";
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

  return (
    <View style={[styles.panel, contentStyle]}>
      {matchedAirport ? (
        <View style={styles.contextRow}>
          <Text style={[styles.contextText, { color: themeColors.subTextColor }]}>
            {searchCode.toUpperCase()}{" "}
            <Text style={{ color: themeColors.textColor, fontWeight: "600" }}>
              - {matchedAirport.name}
            </Text>
            {matchedAirport.country ? `, ${matchedAirport.country}` : ""}
          </Text>
        </View>
      ) : null}

      {foundHotels.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: themeColors.emptyBg,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Text style={[styles.emptyText, { color: themeColors.subTextColor }]}>
            No Hotel details found for "{searchCode.toUpperCase()}".
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
  contextRow: {
    backgroundColor: "transparent",
    marginBottom: 12,
    marginTop: 2,
  },
  contextText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  emptyText: { fontSize: 13 },
});
