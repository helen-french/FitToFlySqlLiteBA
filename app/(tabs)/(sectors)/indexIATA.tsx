import { getHotelByIataCode } from "@/db/hotel-queries"; // Using your perfect path alias
import { SymbolView } from "expo-symbols";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SectorsScreen() {
  // --- Search States ---
  const [searchCode, setSearchCode] = useState("");
  const [foundHotels, setFoundHotels] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleManualSearch = async () => {
    if (!searchCode.trim()) return;

    setSearchLoading(true);
    setHasSearched(true);
    try {
      const results = await getHotelByIataCode(searchCode);
      setFoundHotels(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePhoneCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanNumber}`);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* FIXED WINDOW BLUR OFFSET HEIGHT */}
      <View style={styles.headerSpacer} />

      {/* GLOBAL STATION SEARCH HEADER */}
      <Text style={styles.sectionTitle}>Hotel Search bu IATA code</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="IATA code "
          placeholderTextColor="#868e96"
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
          style={styles.searchButton}
          onPress={handleManualSearch}
        >
          <SymbolView
            name="magnifyingglass"
            style={styles.searchIcon}
            type="monochrome"
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>

      {/* SEARCH RESULTS DISPLAY DRAWER */}
      {searchLoading && (
        <ActivityIndicator size="small" color="#005A9C" style={styles.loader} />
      )}

      {!searchLoading && hasSearched && foundHotels.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No hotel database entries matching "{searchCode.toUpperCase()}".
          </Text>
        </View>
      )}

      {!searchLoading &&
        foundHotels.map((hotel, index) => (
          <View key={`search-${hotel.id || index}`} style={styles.hotelCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.hotelName}>{hotel.name}</Text>
              <View style={styles.iataBadge}>
                <Text style={styles.iataBadgeText}>{hotel.iata}</Text>
              </View>
            </View>

            {hotel.crew && (
              <Text style={styles.crewTag}>👥 Group: {hotel.crew}</Text>
            )}
            {hotel.address && (
              <Text style={styles.addressText}>📍 {hotel.address}</Text>
            )}

            {hotel.tel && (
              <TouchableOpacity
                style={styles.phoneAction}
                onPress={() => handlePhoneCall(hotel.tel)}
              >
                <Text style={styles.phoneText}>📞 Phone: {hotel.tel}</Text>
              </TouchableOpacity>
            )}

            {hotel.comments && (
              <Text style={styles.commentText}>📝 Note: {hotel.comments}</Text>
            )}
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 16 },
  headerSpacer: { height: 110 }, // Increased slightly to push clear past your specific header blur bounds
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#495057",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ced4da",
    overflow: "hidden",
    marginBottom: 16,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#212529",
  },
  searchButton: {
    backgroundColor: "#005A9C",
    height: 46,
    width: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: { width: 18, height: 18 },
  loader: { marginVertical: 10 },
  emptyCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  emptyText: { color: "#868e96", fontSize: 13, fontStyle: "italic" },
  hotelCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
    flex: 1,
    marginRight: 6,
  },
  iataBadge: {
    backgroundColor: "#e7f5ff",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  iataBadgeText: { color: "#228be6", fontWeight: "bold", fontSize: 11 },
  crewTag: {
    fontSize: 12,
    color: "#495057",
    fontWeight: "500",
    marginBottom: 6,
  },
  addressText: {
    fontSize: 13,
    color: "#495057",
    lineHeight: 18,
    marginBottom: 6,
  },
  phoneAction: { alignSelf: "flex-start", marginVertical: 2 },
  phoneText: { fontSize: 13, color: "#228be6", fontWeight: "600" },
  commentText: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
    paddingTop: 6,
    lineHeight: 16,
  },
});
