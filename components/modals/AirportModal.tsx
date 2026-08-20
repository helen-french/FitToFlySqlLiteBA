/**
 * AirportModal
 *
 * Bottom-sheet chrome around shared AirportDetailsPanel (Sectors taps).
 */

import { AirportDetailsPanel } from "@/components/airports/AirportDetailsPanel";
import {
  ROSTER_CARD_DARK_BG,
  ROSTER_CARD_DARK_BORDER,
  ROSTER_CARD_LIGHT_BG,
  ROSTER_CARD_LIGHT_BORDER,
} from "@/components/roster";
import { Text, View } from "@/components/Themed";
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

  const code = stationCode?.trim().toUpperCase() || "";
  const modalOverlay = isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.4)";

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
            {code ? (
              <AirportDetailsPanel
                stationCode={code}
                themeColors={themeColors}
              />
            ) : null}
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
});
