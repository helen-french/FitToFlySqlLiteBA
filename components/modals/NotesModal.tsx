import { NotesByStationPanel } from "@/components/notes/NotesByStationPanel";
import type { NoteCategory } from "@/components/notes/noteCategory";
import { useNotesByStation } from "@/components/notes/useNotesByStation";
import {
  ROSTER_CARD_DARK_BG,
  ROSTER_CARD_DARK_BORDER,
  ROSTER_CARD_LIGHT_BG,
  ROSTER_CARD_LIGHT_BORDER,
} from "@/components/roster";
import { FontAwesome6 } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Text, View } from "@/components/Themed";

type Props = {
  visible: boolean;
  stationCode: string | null;
  category: NoteCategory | null;
  onClose: () => void;
};

export default function NotesModal({
  visible,
  stationCode,
  category,
  onClose,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    searchCode,
    airportName,
    filteredComments,
    loading,
    hasSearched,
    selectedCategory,
    setSelectedCategory,
    runSearch,
    reset,
  } = useNotesByStation();

  useEffect(() => {
    if (visible && stationCode && category) {
      runSearch(stationCode, category);
      return;
    }
    if (!visible) {
      reset();
    }
  }, [visible, stationCode, category, runSearch, reset]);

  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      cardBg: isDark ? ROSTER_CARD_DARK_BG : ROSTER_CARD_LIGHT_BG,
      nestedBoxBg: isDark ? "#2C2C2E" : "#FFFFFF",
      border: isDark ? ROSTER_CARD_DARK_BORDER : ROSTER_CARD_LIGHT_BORDER,
      accent: "#005A9C",
      sliderBg: isDark ? "rgba(28, 28, 30, 0.85)" : "rgba(242, 242, 247, 0.85)",
    }),
    [isDark],
  );

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
            <View style={{ backgroundColor: "transparent" }}>
              <Text
                style={[styles.modalTitleText, { color: themeColors.textColor }]}
              >
                Location Notes
              </Text>
            </View>

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
              accessibilityLabel="Close notes"
            >
              <FontAwesome6
                name="xmark"
                size={14}
                color={themeColors.textColor}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalItemsScrollList}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <NotesByStationPanel
              searchCode={searchCode}
              airportName={airportName}
              filteredComments={filteredComments}
              loading={loading}
              hasSearched={hasSearched}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              themeColors={themeColors}
              showCategoryFilter={false}
            />
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
    height: "75%",
    width: "100%",
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
  modalItemsScrollList: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
});
