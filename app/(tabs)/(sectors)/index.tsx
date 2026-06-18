import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

export default function SectorsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  // Captures structural query variables forwarded from your Trip loop row
  const { startDate, endDate, routing } = useLocalSearchParams<{
    startDate?: string;
    endDate?: string;
    routing?: string;
  }>();

  const handleRefreshSectors = () => {
    console.log("Sector records re-synchronized.");
  };

  const formatCardHeaderDate = useCallback((dateStr: string) => {
    if (!dateStr || !dateStr.includes("-")) return dateStr;
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }, []);

  const themeColors = {
    textColor: isDark ? "#FFFFFF" : "#1A1A1A",
    subTextColor: isDark ? "#A0A0A0" : "#666666",
    accent: "#007AFF",
    border: isDark ? "rgba(56, 56, 58, 0.4)" : "rgba(229, 229, 234, 0.6)",
    nestedBoxBg: isDark ? "#3A3A3C" : "#FFFFFF",
    cardBg: isDark ? "#1C1C1E" : "#F2F2F7",
  };

  return (
    <TabScreenLayout onRefresh={handleRefreshSectors}>
      {/* ──✅ UNIVERSAL PLACEHOLDER FLIGHT PLAN WORLD MAP CARD (Mirrors the Calendar dimensions) */}
      <View
        style={[
          styles.mapContainer,
          {
            backgroundColor: themeColors.cardBg,
            borderColor: themeColors.border,
          },
        ]}
      >
        <Image
          source={require("@/assets/images/LGWToMCO.png")}
          style={styles.mapImage}
          resizeMode="cover"
        />
      </View>

      {routing ? (
        // DISPLAY PATH A: Loaded with active Trip context parameters
        <View style={styles.activeContentContainer}>
          {/* Back Navigation Bar Action link button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(tabs)/(details)")}
            style={[
              styles.backButton,
              {
                borderColor: themeColors.border,
                backgroundColor: themeColors.nestedBoxBg,
              },
            ]}
          >
            <FontAwesome6
              name="arrow-left"
              size={12}
              color={themeColors.accent}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                fontFamily: "GoogleSansBold",
                fontSize: 13,
                color: themeColors.textColor,
              }}
            >
              Back to Trip
            </Text>
          </TouchableOpacity>

          {/* Replicated Timeline Card Visual Header Block */}
          <View style={styles.tripMetaBlock}>
            <Text
              style={{
                fontFamily: "GoogleSansBold",
                fontSize: 14,
                color: themeColors.textColor,
                marginBottom: 4,
              }}
            >
              {formatCardHeaderDate(startDate!)} —{" "}
              {formatCardHeaderDate(endDate!)}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "transparent",
              }}
            >
              <FontAwesome6
                name="plane-departure"
                size={13}
                color={themeColors.accent}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.routingSummaryText,
                  { color: themeColors.textColor },
                ]}
              >
                {routing}
              </Text>
            </View>
          </View>

          {/* Sub-Duty details slot box wrapper */}
          <View
            style={[
              styles.innerContentPlaceholder,
              { borderColor: themeColors.border },
            ]}
          >
            <Text
              style={{
                fontFamily: "GoogleSans",
                fontSize: 14,
                color: themeColors.subTextColor,
                textAlign: "center",
              }}
            >
              more details about the selected sector will appear here when they
              are avaialable. you wont navigate to this screen from the tabbar.
              might loose the clouds ....
            </Text>
          </View>
        </View>
      ) : (
        // PATH B: Blank Fallback state (if opened directly from the Tab Bar)
        <View style={styles.centerContent}>
          <Text
            style={[styles.placeholderTitle, { color: themeColors.textColor }]}
          >
            Sectors
          </Text>
          <Text style={[styles.subText, { color: themeColors.subTextColor }]}>
            Select a specific schedule route chevron inside your Trip feed to
            view active sector analysis logs.
          </Text>
        </View>
      )}
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    height: 180,
    overflow: "hidden",
    borderWidth: 0,
    marginTop: -120,
    marginHorizontal: 0,
    marginBottom: 28, // Adds uniform space pushing text blocks cleanly down below
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  centerContent: {
    alignItems: "center",
    paddingTop: 10,
  },
  activeContentContainer: {
    backgroundColor: "transparent",
    width: "100%",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  tripMetaBlock: {
    backgroundColor: "transparent",
    width: "100%",
    marginBottom: 24,
  },
  routingSummaryText: {
    fontFamily: "GoogleSansBold",
    fontSize: 18,
    letterSpacing: -0.2,
  },
  innerContentPlaceholder: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  placeholderTitle: {
    fontFamily: "GoogleSansBold",
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
