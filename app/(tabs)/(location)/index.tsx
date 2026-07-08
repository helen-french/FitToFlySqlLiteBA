import { HotelCard } from "@/components/HotelCard";
import TabScreenLayout from "@/components/TabScreenLayout";
import { getAirportByIataCode } from "@/db/airport-queries";
import { getActiveHotelsByIata } from "@/db/hotel-queries";
import type { Hotel } from "@/db/schema";
import { useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function LocationScreen() {
  const params = useLocalSearchParams<{ stationCode?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [searchCode, setSearchCode] = useState("");
  const [foundHotels, setFoundHotels] = useState<Hotel[]>([]);
  const [matchedAirport, setMatchedAirport] = useState<{
    name: string;
    country: string;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const cleanAirportName = (name: string) => {
    if (!name) return "";
    return name.replace(/airport/gi, "").trim();
  };

  const runSearch = useCallback(async (rawCode: string) => {
    if (!rawCode.trim()) return;
    const cleanCode = rawCode.trim().toUpperCase();

    setSearchLoading(true);
    setHasSearched(true);
    setMatchedAirport(null);
    setSearchCode(cleanCode);

    try {
      const [activeHotels, airportResults] = await Promise.all([
        getActiveHotelsByIata(cleanCode),
        getAirportByIataCode(cleanCode),
      ]);

      setFoundHotels(activeHotels);

      if (airportResults && airportResults.length > 0) {
        const target = airportResults[0];
        setMatchedAirport({
          name: cleanAirportName(target.name || target.airportName),
          country: target.country || target.countryName,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Deep-link from Sectors Turnaround (or elsewhere): auto-load that station.
  useEffect(() => {
    if (params.stationCode) {
      runSearch(params.stationCode);
    }
  }, [params.stationCode, runSearch]);

  const handleManualSearch = () => {
    runSearch(searchCode);
  };

  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      cardBg: isDark ? "#1C1C1E" : "#FFFFFF",
      border: isDark ? "rgba(56, 56, 58, 0.45)" : "rgba(229, 229, 234, 0.9)",
      accent: "#005A9C",
      inputBg: isDark ? "#151517" : "#FFFFFF",
      emptyBg: isDark ? "#151517" : "#FFFFFF",
    }),
    [isDark],
  );

  return (
    <TabScreenLayout>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.pageTitle, { color: themeColors.textColor }]}>
          Hotels
        </Text>
        <Text style={[styles.pageSubtitle, { color: themeColors.subTextColor }]}>
          Search by IATA code
        </Text>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: themeColors.inputBg,
              borderColor: themeColors.border,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: themeColors.textColor }]}
            placeholder="IATA code"
            placeholderTextColor={themeColors.subTextColor}
            value={searchCode}
            onChangeText={(text) => {
              setSearchCode(text);
              if (hasSearched) setHasSearched(false);
            }}
            autoCapitalize="characters"
            maxLength={3}
            returnKeyType="search"
            onSubmitEditing={handleManualSearch}
          />
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: themeColors.accent }]}
            onPress={handleManualSearch}
          >
            <SymbolView
              name="magnifyingglass"
              style={styles.searchIcon}
              type="monochrome"
            />
          </TouchableOpacity>
        </View>

        {searchLoading && (
          <ActivityIndicator
            size="small"
            color={themeColors.accent}
            style={styles.loader}
          />
        )}

        {!searchLoading && hasSearched && matchedAirport && (
          <View style={styles.contextRow}>
            <Text style={[styles.contextText, { color: themeColors.subTextColor }]}>
              {searchCode.toUpperCase()}{" "}
              <Text style={{ color: themeColors.textColor, fontWeight: "600" }}>
                - {matchedAirport.name}
              </Text>
              {matchedAirport.country ? `, ${matchedAirport.country}` : ""}
            </Text>
          </View>
        )}

        {!searchLoading && hasSearched && foundHotels.length === 0 && (
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
              No active hotel contract for "{searchCode.toUpperCase()}".
            </Text>
          </View>
        )}

        {!searchLoading &&
          foundHotels.map((hotel, index) => (
            <HotelCard key={`search-${hotel.id || index}`} hotel={hotel} />
          ))}
      </ScrollView>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  searchButton: {
    height: 46,
    width: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: { width: 18, height: 18 },
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
