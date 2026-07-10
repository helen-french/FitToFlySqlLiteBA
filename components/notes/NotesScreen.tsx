/**
 * Full-screen Location Notes UI (Tools → Location Notes).
 */

import FeatureBannerLayout from "@/components/layout/FeatureBannerLayout";
import FeatureScreenBody from "@/components/layout/FeatureScreenBody";
import { useFeatureScreenTheme } from "@/components/layout/useFeatureScreenTheme";
import { IATASearchBar } from "@/components/ui/IATASearchBar";
import { NOTE_CATEGORY_META } from "@/components/notes/noteCategory";
import { NotesByStationPanel } from "@/components/notes/NotesByStationPanel";
import type { NoteCategory, NoteCategoryFilter } from "@/components/notes/noteCategory";
import { useNotesByStation } from "@/components/notes/useNotesByStation";
import { db } from "@/db/db";
import { airportComments } from "@/db/schema";
import { useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function NotesScreen() {
  const params = useLocalSearchParams<{
    stationCode?: string;
    category?: string;
  }>();

  const themeColors = useFeatureScreenTheme();

  const {
    searchCode,
    setSearchCode,
    airportName,
    filteredComments,
    loading,
    hasSearched,
    setHasSearched,
    selectedCategory,
    setSelectedCategory,
    runSearch,
  } = useNotesByStation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [activeFormCategory, setActiveFormCategory] =
    useState<NoteCategory>("A");

  useEffect(() => {
    if (params.stationCode) {
      const targetIata = params.stationCode.trim().toUpperCase();
      const rawCategory = params.category?.trim().toUpperCase();
      const initialCategory: NoteCategoryFilter | undefined =
        rawCategory === "A" || rawCategory === "E" || rawCategory === "D"
          ? rawCategory
          : rawCategory === "ALL"
            ? "ALL"
            : undefined;

      runSearch(targetIata, initialCategory);
    }
  }, [params.stationCode, params.category, runSearch]);

  const handleSaveNewComment = async () => {
    if (!newCommentText.trim() || !searchCode) return;
    const cleanCode = searchCode.trim().toUpperCase();

    try {
      await db.insert(airportComments).values({
        iataCode: cleanCode,
        category: activeFormCategory,
        content: newCommentText.trim(),
        authorName: authorName.trim() || "Anonymous",
        createdAt: new Date().toISOString(),
      });

      setNewCommentText("");
      setIsFormOpen(false);
      await runSearch(cleanCode, selectedCategory);
    } catch (err) {
      console.error("Failed to insert comment note row:", err);
    }
  };

  return (
    <FeatureBannerLayout title="Location Notes">
      <FeatureScreenBody>
        <IATASearchBar
          value={searchCode}
          onChangeText={(text) => {
            setSearchCode(text);
            if (hasSearched) setHasSearched(false);
          }}
          onSearch={() => runSearch(searchCode)}
          theme={themeColors}
        />

        <NotesByStationPanel
          searchCode={searchCode}
          airportName={airportName}
          filteredComments={filteredComments}
          loading={loading}
          hasSearched={hasSearched}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          themeColors={themeColors}
          onPressAddNote={
            hasSearched && !loading ? () => setIsFormOpen(true) : undefined
          }
        />

        {!hasSearched && !loading ? (
          <View style={styles.fallbackEmptyStateFrame}>
            <SymbolView
              name="mappin.and.ellipse"
              style={{ width: 32, height: 32, marginBottom: 12 }}
              type="monochrome"
              color={themeColors.subTextColor}
            />
            <Text
              style={[
                styles.fallbackEmptyText,
                { color: themeColors.subTextColor },
              ]}
            >
              Query a destination station code above to review and add
              operational updates.
            </Text>
          </View>
        ) : null}
      </FeatureScreenBody>

      <Modal
          visible={isFormOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsFormOpen(false)}
        >
          <View
            style={[
              styles.modalOverlayBackdrop,
              { backgroundColor: themeColors.modalOverlay },
            ]}
          >
            <Animated.View
              entering={FadeInUp.duration(250)}
              style={[
                styles.modalContentDrawer,
                { backgroundColor: themeColors.cardBg },
              ]}
            >
              <View style={styles.modalHeaderControlRow}>
                <Text
                  style={[
                    styles.modalSheetTitle,
                    { color: themeColors.textColor },
                  ]}
                >
                  Add Note
                </Text>
                <TouchableOpacity
                  style={[
                    styles.closeModalBtn,
                    { backgroundColor: themeColors.nestedBoxBg },
                  ]}
                  onPress={() => setIsFormOpen(false)}
                >
                  <SymbolView
                    name="xmark"
                    style={{ width: 12, height: 12 }}
                    type="monochrome"
                    color={themeColors.textColor}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.formCategoryPillRow}>
                {(["A", "E", "D"] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveFormCategory(cat)}
                    style={[
                      styles.formRadioPill,
                      activeFormCategory === cat && {
                        backgroundColor: themeColors.accent,
                        borderColor: themeColors.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.formRadioText,
                        {
                          color:
                            activeFormCategory === cat
                              ? "#FFFFFF"
                              : themeColors.subTextColor,
                        },
                      ]}
                    >
                      {NOTE_CATEGORY_META[cat].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[
                  styles.authorInputField,
                  {
                    color: themeColors.textColor,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.nestedBoxBg,
                  },
                ]}
                placeholder="Your Name (leaves Anonymous if blank)"
                placeholderTextColor="#868e96"
                value={authorName}
                onChangeText={setAuthorName}
              />

              <TextInput
                style={[
                  styles.formTextArea,
                  {
                    color: themeColors.textColor,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.nestedBoxBg,
                  },
                ]}
                placeholder="Add details..."
                placeholderTextColor="#868e96"
                multiline
                numberOfLines={5}
                value={newCommentText}
                onChangeText={setNewCommentText}
              />

              <TouchableOpacity
                style={[
                  styles.submitNoteBtn,
                  { backgroundColor: themeColors.accent },
                ]}
                disabled={!newCommentText.trim()}
                onPress={handleSaveNewComment}
              >
                <SymbolView
                  name="checkmark"
                  style={{ width: 12, height: 12, marginRight: 6 }}
                  type="monochrome"
                  color="#ffffff"
                />
                <Text style={styles.submitBtnText}>Save Note</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
    </FeatureBannerLayout>
  );
}

const styles = StyleSheet.create({
  fallbackEmptyStateFrame: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  fallbackEmptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  modalOverlayBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContentDrawer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 44,
    width: "100%",
  },
  modalHeaderControlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeModalBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  formCategoryPillRow: {
    flexDirection: "row",
    backgroundColor: "transparent",
    marginBottom: 14,
  },
  formRadioPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ced4da",
    marginRight: 8,
  },
  formRadioText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  authorInputField: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  formTextArea: {
    minHeight: 110,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  submitNoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});
