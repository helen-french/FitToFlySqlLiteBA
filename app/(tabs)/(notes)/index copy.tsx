import { SymbolView } from "expo-symbols";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

import TabScreenLayout from "@/components/TabScreenLayout";
import { db } from "@/db/db";
import { airportComments, airports } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

type FilterCategory = "ALL" | "A" | "E" | "D";

export default function NotesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- Design Token Styling ---
  const themeColors = useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      cardBg: isDark ? "#1C1C1E" : "#FFFFFF",
      nestedBoxBg: isDark ? "#3A3A3C" : "#FFFFFF",
      border: isDark ? "rgba(56, 56, 58, 0.4)" : "rgba(229, 229, 234, 0.6)",
      accent: "#005A9C",
      sliderBg: isDark ? "rgba(28, 28, 30, 0.85)" : "rgba(242, 242, 247, 0.85)",
      modalOverlay: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.4)",
    }),
    [isDark],
  );

  // --- Core State Variables ---
  const [searchCode, setSearchCode] = useState("");
  const [airportName, setAirportName] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Comments stream lists & category filter controls
  const [allComments, setAllComments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>("ALL");

  // New Comment Entry inputs
  const [newCommentText, setNewCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [activeFormCategory, setActiveFormCategory] =
    useState<Exclude<FilterCategory, "ALL">>("A");

  // --- Database Fetching Logic ---
  const handleLoadLocationNotes = async (targetCode: string) => {
    if (!targetCode.trim()) return;
    const cleanCode = targetCode.trim().toUpperCase();

    setIsLoading(true);
    setHasSearched(true);
    setAirportName(null);

    try {
      const airportRow = await db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, cleanCode))
        .limit(1);

      if (airportRow.length > 0) {
        setAirportName(airportRow[0].name.replace(/airport/gi, "").trim());
      }

      const commentRows = await db
        .select()
        .from(airportComments)
        .where(eq(airportComments.iataCode, cleanCode))
        .orderBy(desc(airportComments.createdAt));

      setAllComments(commentRows);
    } catch (err) {
      console.error("Failed to load notes stream:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Database Insertion Logic ---
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
      setIsFormOpen(false); // Dismiss sheet immediately on save success
      await handleLoadLocationNotes(cleanCode);
    } catch (err) {
      console.error("Failed to insert comment note row:", err);
    }
  };

  const filteredCommentsStream = useMemo(() => {
    if (selectedCategory === "ALL") return allComments;
    return allComments.filter((c) => c.category === selectedCategory);
  }, [allComments, selectedCategory]);

  const categoryMetaMap = {
    A: { label: "Arrival", icon: "square.and.arrow.down", color: "#34C759" },
    E: { label: "Enroute", icon: "arrow.forward", color: "#FF9500" },
    D: { label: "Departure", icon: "square.and.arrow.up", color: "#007AFF" },
  };

  return (
    <TabScreenLayout>
      <View style={styles.rootContainer}>
        {/* --- IATA LOOKUP INPUT COMPONENT --- */}
        <View style={styles.searchRowContainer}>
          <TextInput
            style={[
              styles.inputField,
              {
                backgroundColor: themeColors.cardBg,
                color: themeColors.textColor,
                borderColor: themeColors.border,
              },
            ]}
            placeholder="IATA code"
            placeholderTextColor="#868e96"
            value={searchCode}
            onChangeText={(text) => {
              setSearchCode(text);
              if (hasSearched) setHasSearched(false);
            }}
            autoCapitalize="characters"
            maxLength={3}
            returnKeyType="search"
            onSubmitEditing={() => handleLoadLocationNotes(searchCode)}
          />
          <TouchableOpacity
            style={[
              styles.searchActionBtn,
              { backgroundColor: themeColors.accent },
            ]}
            onPress={() => handleLoadLocationNotes(searchCode)}
          >
            <SymbolView
              name="magnifyingglass"
              style={styles.searchIcon}
              type="monochrome"
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        {isLoading && (
          <ActivityIndicator
            size="small"
            color={themeColors.accent}
            style={{ marginVertical: 20 }}
          />
        )}

        {/* --- METADATA AIRPORT HEADER WITH COMPOSE BUTTON --- */}
        {!isLoading && hasSearched && (
          <View style={styles.airportMetaMetaCard}>
            <View style={styles.airportHeaderLeft}>
              <Text
                style={[
                  styles.metaAirportTitle,
                  { color: themeColors.textColor },
                ]}
              >
                ✈️{" "}
                {airportName
                  ? airportName
                  : `${searchCode.toUpperCase()} Station`}
              </Text>
            </View>

            {/* Add Note Trigger Button */}
            <TouchableOpacity
              style={[
                styles.composeButton,
                { backgroundColor: themeColors.accent },
              ]}
              onPress={() => setIsFormOpen(true)}
            >
              <SymbolView
                name="square.and.pencil"
                style={{ width: 14, height: 14, marginRight: 6 }}
                type="monochrome"
                color="#ffffff"
              />
              <Text style={styles.composeButtonText}>Add Note</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- FILTER SLIDER CONTROLLER --- */}
        {hasSearched && !isLoading && allComments.length > 0 && (
          <View
            style={[
              styles.segmentSliderBar,
              {
                backgroundColor: themeColors.sliderBg,
                borderColor: themeColors.border,
              },
            ]}
          >
            {(["ALL", "A", "E", "D"] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.segmentSliderPill,
                  selectedCategory === cat && [
                    styles.activeSliderPillShadow,
                    { backgroundColor: themeColors.nestedBoxBg },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.sliderLabel,
                    {
                      color:
                        selectedCategory === cat
                          ? themeColors.textColor
                          : themeColors.subTextColor,
                    },
                  ]}
                >
                  {cat === "ALL" ? "All" : categoryMetaMap[cat].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* --- READ-ONLY LOG ENTRIES LIST --- */}
        {filteredCommentsStream.map((item, index) => {
          const meta = categoryMetaMap[
            item.category as keyof typeof categoryMetaMap
          ] || { label: "General", icon: "doc.plaintext", color: "#8E8E93" };
          const formattedDate = new Date(item.createdAt).toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          );

          return (
            <Animated.View
              key={item.id?.toString() || index.toString()}
              entering={FadeInUp}
              exiting={FadeOutDown}
              style={[
                styles.commentCardRow,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.cardRowTopHeader}>
                <View
                  style={[
                    styles.categoryBadgeTag,
                    { backgroundColor: `${meta.color}15` },
                  ]}
                >
                  <SymbolView
                    name={meta.icon}
                    style={{ width: 11, height: 11, marginRight: 6 }}
                    type="monochrome"
                    color={meta.color}
                  />
                  <Text
                    style={[styles.categoryBadgeLabel, { color: meta.color }]}
                  >
                    {meta.label}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.timestampLabel,
                    { color: themeColors.subTextColor },
                  ]}
                >
                  {formattedDate}
                </Text>
              </View>
              <Text
                style={[
                  styles.commentContentBodyText,
                  { color: themeColors.textColor },
                ]}
              >
                {item.content}
              </Text>

              <View style={styles.cardAuthorRowFooter}>
                <SymbolView
                  name="person.circle"
                  style={{ width: 11, height: 11, marginRight: 5 }}
                  type="monochrome"
                  color={themeColors.subTextColor}
                />
                <Text
                  style={[
                    styles.cardAuthorTextText,
                    { color: themeColors.subTextColor },
                  ]}
                >
                  Filed by: {item.authorName || "Anonymous"}
                </Text>
              </View>
            </Animated.View>
          );
        })}

        {/* --- EMPTY FALLBACK COMPONENT DECORATIONS --- */}
        {hasSearched && !isLoading && filteredCommentsStream.length === 0 && (
          <View style={styles.fallbackEmptyStateFrame}>
            <SymbolView
              name="bubble.left.and.bubble.right"
              style={{ width: 28, height: 28, marginBottom: 12 }}
              type="monochrome"
              color={themeColors.subTextColor}
            />
            <Text
              style={[
                styles.fallbackEmptyText,
                { color: themeColors.subTextColor },
              ]}
            >
              No logged entries found under this category filter path.
            </Text>
          </View>
        )}

        {!hasSearched && (
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
        )}

        {/* --- DECOUPLED DATA ENTRY MODAL COMPONENT SHEET --- */}
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
              {/* Modal Header Panel Row */}
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

              {/* Form Category Pill Selectors */}
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
                      {categoryMetaMap[cat].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Author Identification Input */}
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

              {/* Content Body Editor Textarea */}
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

              {/* Submit Save Transaction Action bar */}
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
      </View>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -45,
    paddingBottom: 60,
  },
  searchRowContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ced4da",
    overflow: "hidden",
    marginBottom: 10,
    alignItems: "center",
  },
  inputField: {
    flex: 1,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  searchActionBtn: {
    height: 46,
    width: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: { width: 18, height: 18 },
  airportMetaMetaCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
    marginTop: 2,
    width: "100%",
  },
  airportHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  metaAirportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: -0.2,
  },
  composeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  composeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  segmentSliderBar: {
    flexDirection: "row",
    height: 38,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: "#ced4da",
    marginBottom: 14,
    width: "100%",
  },
  segmentSliderPill: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 9,
  },
  activeSliderPillShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 2,
  },
  sliderLabel: {
    fontWeight: "bold",
    fontSize: 12,
  },
  commentCardRow: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    width: "100%",
  },
  cardRowTopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 8,
  },
  categoryBadgeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeLabel: {
    fontWeight: "bold",
    fontSize: 10,
  },
  timestampLabel: {
    fontSize: 11,
  },
  commentContentBodyText: {
    fontSize: 14,
    lineHeight: 19,
  },
  cardAuthorRowFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(134,142,150,0.2)",
    paddingTop: 6,
  },
  cardAuthorTextText: {
    fontSize: 11,
    fontWeight: "500",
  },
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
  // --- DETACHED SHEET STYLES ---
  modalOverlayBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContentDrawer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 44, // Generous layout spacing protecting device safe indicator zones
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
    height: 110,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  submitNoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderRadius: 10,
    width: "100%",
  },
  submitBtnText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
