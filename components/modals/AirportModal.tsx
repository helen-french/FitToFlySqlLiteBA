/**
 * AirportModal
 *
 * Bottom-sheet tray showing reference details for one IATA station
 * (from static `data/airport-codes.json` via getAirportByIataCode).
 * Chrome matches Hotels / Credit: title "Airport" + close pill.
 * IATA badge matches HotelCard via StationIataBadge.
 */

import {
  formatAirportCountryDisplay,
  getAirportByIataCode,
} from "@/db/airport-queries";
import {
  ROSTER_CARD_DARK_BG,
  ROSTER_CARD_DARK_BORDER,
  ROSTER_CARD_LIGHT_BG,
  ROSTER_CARD_LIGHT_BORDER,
} from "@/components/roster";
import { Text, View } from "@/components/Themed";
import { StationIataBadge } from "@/components/ui/StationIataBadge";
import { FontAwesome6 } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

type Props = {
  visible: boolean;
  stationCode: string | null;
  onClose: () => void;
};

export default function AirportModal({
  visible,
  stationCode,
  onClose,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      cardBg: isDark ? ROSTER_CARD_DARK_BG : ROSTER_CARD_LIGHT_BG,
      nestedBoxBg: isDark ? "#2C2C2E" : "#FFFFFF",
      border: isDark ? ROSTER_CARD_DARK_BORDER : ROSTER_CARD_LIGHT_BORDER,
      accent: "#007AFF",
      heroBg: isDark ? "rgba(0, 122, 255, 0.16)" : "rgba(0, 122, 255, 0.08)",
      chipBg: isDark ? "#1C1C1E" : "#F2F2F7",
    }),
    [isDark],
  );

  const airport = useMemo(() => {
    if (!stationCode?.trim()) return null;
    const rows = getAirportByIataCode(stationCode);
    return rows[0] ?? null;
  }, [stationCode]);

  const code = stationCode?.trim().toUpperCase() || "";
  const modalOverlay = isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.4)";

  const displayName = airport?.name ? String(airport.name) : null;
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: modalOverlay }]}>
        <TouchableOpacity
          style={styles.dismissTapArea}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={[
            styles.modalTrayContent,
            { backgroundColor: themeColors.cardBg },
          ]}
        >
          <View style={styles.modalHeaderRow}>
            <Text
              style={[styles.modalTitleText, { color: themeColors.textColor }]}
            >
              Airport
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[
                styles.closeTrayButton,
                {
                  backgroundColor: themeColors.nestedBoxBg,
                  borderColor: themeColors.border,
                },
              ]}
              accessibilityLabel="Close airport details"
            >
              <FontAwesome6
                name="xmark"
                size={14}
                color={themeColors.textColor}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {airport ? (
              <>
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
                    <Text
                      style={[
                        styles.heroName,
                        { color: themeColors.textColor },
                      ]}
                    >
                      {displayName || airport.name}
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
                        {[airport.city, countryLabel]
                          .filter(Boolean)
                          .join(", ")}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.sectionLabel,
                    { color: themeColors.subTextColor },
                  ]}
                >
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
                        style={[
                          styles.chipLabel,
                          { color: themeColors.subTextColor },
                        ]}
                      >
                        {chip.label}
                      </Text>
                      <Text
                        style={[
                          styles.chipValue,
                          { color: themeColors.textColor },
                        ]}
                        numberOfLines={2}
                      >
                        {chip.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
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
                <Text
                  style={[
                    styles.emptyText,
                    { color: themeColors.subTextColor },
                  ]}
                >
                  No airport details found for “{code || "this code"}”.
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  dismissTapArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  modalTrayContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    width: "100%",
    maxHeight: "72%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "transparent",
    paddingBottom: 16,
  },
  modalTitleText: {
    fontFamily: "GoogleSansBold",
    fontSize: 20,
    letterSpacing: -0.4,
  },
  closeTrayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 20,
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
