import { getAirportByIataCode } from "@/db/airport-queries";
import { getHotelByIataCode } from "@/db/hotel-queries";
import { SymbolView } from "expo-symbols";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ Re-wrapped cleanly into your global TabScreenLayout layout template
import TabScreenLayout from "@/components/TabScreenLayout";

export default function LocationScreen() {
  // --- Search States ---
  const [searchCode, setSearchCode] = useState("");
  const [foundHotels, setFoundHotels] = useState<any[]>([]);
  const [matchedAirport, setMatchedAirport] = useState<{
    name: string;
    country: string;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const cleanAirportName = (name: string) => {
    if (!name) return "";
    return name.replace(/airport/gi, "").trim();
  };

  const handleManualSearch = async () => {
    if (!searchCode.trim()) return;

    setSearchLoading(true);
    setHasSearched(true);
    setMatchedAirport(null);

    try {
      const [hotelResults, airportResults] = await Promise.all([
        getHotelByIataCode(searchCode),
        getAirportByIataCode(searchCode),
      ]);

      const safeHotels = Array.isArray(hotelResults) ? hotelResults : [];
      const currentActiveHotels = safeHotels.filter(
        (hotel) =>
          hotel && (hotel.effectiveTo === null || hotel.effectiveTo === ""),
      );
      setFoundHotels(currentActiveHotels);

      if (airportResults && airportResults.length > 0) {
        const target = airportResults[0];
        setMatchedAirport({
          name: cleanAirportName(target.name || target.airportName),
          country: target.country || target.countryName,
        });
      }
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
    <TabScreenLayout>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* ENLARGED LOGO STATION */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/logos/hotel.png")}
            style={styles.hotelLogo}
            resizeMode="contain"
          />
        </View>

        {/* GLOBAL STATION SEARCH HEADER */}
        <Text style={styles.sectionTitle}>Hotel Search by IATA code</Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
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
          <ActivityIndicator
            size="small"
            color="#005A9C"
            style={styles.loader}
          />
        )}

        {/* AIRPORT DETAILS DISPLAYS FIRST BEFORE THE HOTELS LIST */}
        {!searchLoading && hasSearched && matchedAirport && (
          <View style={styles.airportHeaderCard}>
            <Text style={styles.airportTitleText}>
              ✈️ {matchedAirport.name}
            </Text>
            {matchedAirport.country && (
              <Text style={styles.airportCountryText}>
                {matchedAirport.country}
              </Text>
            )}
          </View>
        )}

        {!searchLoading && hasSearched && foundHotels.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No active hotel contracts matching "{searchCode.toUpperCase()}".
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

              {/* GROUP: PROFILE INFO */}
              {hotel.crew && (
                <Text style={styles.crewTag}>👥 Group: {hotel.crew}</Text>
              )}

              {hotel.address && (
                <Text style={styles.addressText}>📍 {hotel.address}</Text>
              )}

              {/* GROUP: HOTEL CORE CONTACTS */}
              {hotel.tel && (
                <TouchableOpacity
                  style={styles.phoneAction}
                  onPress={() => handlePhoneCall(hotel.tel)}
                >
                  <Text style={styles.phoneText}>
                    📞 Hotel Phone: {hotel.tel}
                  </Text>
                </TouchableOpacity>
              )}

              {hotel.email && (
                <Text style={styles.emailText}>
                  ✉️ <Text style={styles.boldEmailLabel}>Hotel Email:</Text>{" "}
                  {hotel.email}
                </Text>
              )}

              {/* GROUP: CONTRACT DETAILS & AMENITIES */}
              {hotel.host === true && (
                <Text style={styles.detailText}>
                  🏢 <Text style={styles.boldLabel}>Host Hotel:</Text> Yes
                </Text>
              )}

              {hotel.internet && (
                <Text style={styles.detailText}>
                  📶 <Text style={styles.boldLabel}>Internet:</Text>{" "}
                  {hotel.internet}
                </Text>
              )}

              {hotel.healthClub && (
                <Text style={styles.detailText}>
                  🏋️‍♂️ <Text style={styles.boldLabel}>Gym/Health Club:</Text>{" "}
                  {hotel.healthClub}
                </Text>
              )}

              {hotel.discountsAvailable && (
                <Text style={styles.detailText}>
                  🏷️ <Text style={styles.boldLabel}>Discounts:</Text>{" "}
                  {hotel.discountsAvailable}
                </Text>
              )}

              {hotel.comments && (
                <Text style={styles.commentText}>
                  📝 Note: {hotel.comments}
                </Text>
              )}

              {/* Separator placed right before transport blocks start */}
              {(hotel.transportProvider || hotel.transportPhone) && (
                <View style={styles.cardDivider} />
              )}

              {/* GROUP: TRANSPORT DETAILS */}
              {hotel.transportProvider && (
                <Text style={styles.detailText}>
                  🚌 <Text style={styles.boldLabel}>Transport:</Text>{" "}
                  {hotel.transportProvider}
                </Text>
              )}

              {hotel.transportPhone && (
                <Text style={styles.detailText}>
                  📞 <Text style={styles.boldLabel}>Transport Phone:</Text>{" "}
                  {hotel.transportPhone}
                </Text>
              )}
            </View>
          ))}
      </ScrollView>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    marginTop: -45,
  },
  hotelLogo: {
    width: 180,
    height: 180,
    tintColor: "#005A9C",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#495057",
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ced4da",
    overflow: "hidden",
    marginBottom: 10,
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
  airportHeaderCard: {
    backgroundColor: "transparent",
    paddingHorizontal: 4,
    marginBottom: 14,
    marginTop: 2,
  },
  airportTitleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    letterSpacing: -0.2,
  },
  airportCountryText: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "500",
    marginTop: 1,
    paddingLeft: 24,
  },
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
    marginBottom: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: 10,
  },
  detailText: {
    fontSize: 13,
    color: "#495057",
    marginTop: 5,
    lineHeight: 18,
  },
  emailText: {
    fontSize: 13,
    color: "#228be6",
    marginBottom: 8,
    lineHeight: 18,
  },
  boldLabel: {
    fontWeight: "600",
    color: "#343a40",
  },
  boldEmailLabel: {
    fontWeight: "600",
    color: "#228be6",
  },
  phoneAction: {
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 13,
    color: "#228be6",
    fontWeight: "600",
    lineHeight: 18,
  },
  commentText: {
    fontSize: 13,
    color: "#495057",
    marginTop: 5,
    lineHeight: 18,
  },
});
