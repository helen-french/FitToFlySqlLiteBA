import { HotelsByStationPanel } from "@/components/hotels/HotelsByStationPanel";
import { useHotelsByIata } from "@/components/hotels/useHotelsByIata";
import TabScreenLayout from "@/components/TabScreenLayout";
import { useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useEffect, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function HotelsScreen() {
  const params = useLocalSearchParams<{ stationCode?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    searchCode,
    setSearchCode,
    foundHotels,
    matchedAirport,
    loading,
    hasSearched,
    setHasSearched,
    runSearch,
  } = useHotelsByIata();

  // Deep-link with station code (e.g. from elsewhere) still auto-loads.
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
    <TabScreenLayout
      showLoadRosterAction={false}
      showLoadHotelsAction={false}
      showBackAction
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contentLift}
      >
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

        <HotelsByStationPanel
          searchCode={searchCode}
          foundHotels={foundHotels}
          matchedAirport={matchedAirport}
          loading={loading}
          hasSearched={hasSearched}
          themeColors={themeColors}
        />
      </ScrollView>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentLift: {
    marginTop: 0,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: 0,
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
});
