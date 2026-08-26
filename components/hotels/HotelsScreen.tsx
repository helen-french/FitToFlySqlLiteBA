/**
 * Full-screen Hotels UI (Tools → Hotels).
 * Shares StationLookup chrome with Airports for a consistent Tools pattern.
 */

import { HotelsByStationPanel } from "@/components/hotels/HotelsByStationPanel";
import { useHotelsByIata } from "@/components/hotels/useHotelsByIata";
import FeatureBannerLayout from "@/components/layout/FeatureBannerLayout";
import FeatureScreenBody from "@/components/layout/FeatureScreenBody";
import { useFeatureScreenTheme } from "@/components/layout/useFeatureScreenTheme";
import {
  StationLookupIdle,
  StationLookupSearch,
} from "@/components/lookup/StationLookupSearch";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";

export default function HotelsScreen() {
  const params = useLocalSearchParams<{ stationCode?: string }>();
  const themeColors = useFeatureScreenTheme();

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

  useEffect(() => {
    if (params.stationCode) {
      runSearch(params.stationCode);
    }
  }, [params.stationCode, runSearch]);

  const handleManualSearch = () => {
    runSearch(searchCode);
  };

  return (
    <FeatureBannerLayout title="Hotels">
      <FeatureScreenBody>
        <StationLookupSearch
          value={searchCode}
          onChangeText={(text) => {
            setSearchCode(text.toUpperCase());
            if (hasSearched) setHasSearched(false);
          }}
          onSearch={handleManualSearch}
          theme={themeColors}
          searchIcon="airplane-outline"
          placeholder="e.g. LHR"
        />

        {!hasSearched && !loading ? (
          <StationLookupIdle
            theme={themeColors}
            icon="bed-outline"
            title="Search a hotel"
            body="Look up a list of active crew hotels, contact details and transport notes where available for an airport using the three-letter IATA code. E.g for LHR, JFK, BOM ...etc."
          />
        ) : (
          <HotelsByStationPanel
            searchCode={searchCode}
            foundHotels={foundHotels}
            matchedAirport={matchedAirport}
            loading={loading}
            hasSearched={hasSearched}
            themeColors={{
              ...themeColors,
              heroBg: themeColors.heroBg,
              chipBg: themeColors.chipBg,
              isDark: themeColors.isDark,
            }}
          />
        )}
      </FeatureScreenBody>
    </FeatureBannerLayout>
  );
}
