/**
 * Full-screen Hotels UI (Tools → Hotels).
 */

import FeatureBannerLayout from "@/components/layout/FeatureBannerLayout";
import FeatureScreenBody from "@/components/layout/FeatureScreenBody";
import { useFeatureScreenTheme } from "@/components/layout/useFeatureScreenTheme";
import { HotelsByStationPanel } from "@/components/hotels/HotelsByStationPanel";
import { useHotelsByIata } from "@/components/hotels/useHotelsByIata";
import { IATASearchBar } from "@/components/ui/IATASearchBar";
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
        <IATASearchBar
          value={searchCode}
          onChangeText={(text) => {
            setSearchCode(text);
            if (hasSearched) setHasSearched(false);
          }}
          onSearch={handleManualSearch}
          theme={themeColors}
        />

        <HotelsByStationPanel
          searchCode={searchCode}
          foundHotels={foundHotels}
          matchedAirport={matchedAirport}
          loading={loading}
          hasSearched={hasSearched}
          themeColors={themeColors}
        />
      </FeatureScreenBody>
    </FeatureBannerLayout>
  );
}
