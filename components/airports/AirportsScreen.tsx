/**
 * Tools → Airports lookup.
 *
 * Reuses AirportDetailsPanel (same content as the Sectors airport popup).
 */

import { AirportDetailsPanel } from "@/components/airports/AirportDetailsPanel";
import FeatureBannerLayout from "@/components/layout/FeatureBannerLayout";
import FeatureScreenBody from "@/components/layout/FeatureScreenBody";
import { useFeatureScreenTheme } from "@/components/layout/useFeatureScreenTheme";
import {
  StationLookupIdle,
  StationLookupSearch,
} from "@/components/lookup/StationLookupSearch";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

export default function AirportsScreen() {
  const params = useLocalSearchParams<{ stationCode?: string }>();
  const theme = useFeatureScreenTheme();

  const [draftCode, setDraftCode] = useState("");
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = (raw: string) => {
    const clean = raw.trim().toUpperCase();
    if (!clean) return;
    setDraftCode(clean);
    setLoading(true);
    // Lookup is sync; brief tick keeps the search feel consistent with Hotels.
    requestAnimationFrame(() => {
      setActiveCode(clean);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (params.stationCode) {
      runSearch(params.stationCode);
    }
  }, [params.stationCode]);

  return (
    <FeatureBannerLayout title="Airports">
      <FeatureScreenBody>
        <StationLookupSearch
          value={draftCode}
          onChangeText={(text) => {
            setDraftCode(text.toUpperCase());
            if (activeCode) setActiveCode(null);
          }}
          onSearch={() => runSearch(draftCode)}
          theme={theme}
          searchIcon="airplane-outline"
        />

        {loading ? (
          <ActivityIndicator
            size="small"
            color={theme.accent}
            style={{ marginTop: 24 }}
          />
        ) : activeCode ? (
          <AirportDetailsPanel
            stationCode={activeCode}
            themeColors={{
              textColor: theme.textColor,
              subTextColor: theme.subTextColor,
              border: theme.border,
              accent: theme.accent,
              heroBg: theme.heroBg,
              chipBg: theme.chipBg,
            }}
          />
        ) : (
          <StationLookupIdle
            theme={theme}
            icon="airplane-outline"
            title="Search an airport"
            body="Look up an airport using the three-letter IATA code for official name, city, and reference details. E.g for LHR, JFK, BOM ...etc."
          />
        )}
      </FeatureScreenBody>
    </FeatureBannerLayout>
  );
}
