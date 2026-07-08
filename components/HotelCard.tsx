/**
 * HotelCard
 *
 * Presentational hotel contract card — same layout as the Location tab
 * hotel search results. One card per active hotel for an IATA station.
 */

import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Hotel } from "@/db/schema";

interface Props {
  hotel: Hotel | (Partial<Hotel> & { id?: number; name: string; iata: string });
}

function handlePhoneCall(phoneNumber: string) {
  if (!phoneNumber) return;
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, "");
  Linking.openURL(`tel:${cleanNumber}`);
}

export function HotelCard({ hotel }: Props) {
  return (
    <View style={styles.hotelCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.hotelName}>{hotel.name}</Text>
        <View style={styles.iataBadge}>
          <Text style={styles.iataBadgeText}>{hotel.iata}</Text>
        </View>
      </View>

      {hotel.crew ? (
        <Text style={styles.crewTag}>👥 Group: {hotel.crew}</Text>
      ) : null}

      {hotel.address ? (
        <Text style={styles.addressText}>📍 {hotel.address}</Text>
      ) : null}

      {hotel.tel ? (
        <TouchableOpacity
          style={styles.phoneAction}
          onPress={() => handlePhoneCall(hotel.tel!)}
        >
          <Text style={styles.phoneText}>📞 Hotel Phone: {hotel.tel}</Text>
        </TouchableOpacity>
      ) : null}

      {hotel.email ? (
        <Text style={styles.emailText}>
          ✉️ <Text style={styles.boldEmailLabel}>Hotel Email:</Text>{" "}
          {hotel.email}
        </Text>
      ) : null}

      {hotel.host === true ? (
        <Text style={styles.detailText}>
          🏢 <Text style={styles.boldLabel}>Host Hotel:</Text> Yes
        </Text>
      ) : null}

      {hotel.internet ? (
        <Text style={styles.detailText}>
          📶 <Text style={styles.boldLabel}>Internet:</Text> {hotel.internet}
        </Text>
      ) : null}

      {hotel.healthClub ? (
        <Text style={styles.detailText}>
          🏋️‍♂️ <Text style={styles.boldLabel}>Gym/Health Club:</Text>{" "}
          {hotel.healthClub}
        </Text>
      ) : null}

      {hotel.discountsAvailable ? (
        <Text style={styles.detailText}>
          🏷️ <Text style={styles.boldLabel}>Discounts:</Text>{" "}
          {hotel.discountsAvailable}
        </Text>
      ) : null}

      {hotel.comments ? (
        <Text style={styles.commentText}>📝 Note: {hotel.comments}</Text>
      ) : null}

      {(hotel.transportProvider || hotel.transportPhone) && (
        <View style={styles.cardDivider} />
      )}

      {hotel.transportProvider ? (
        <Text style={styles.detailText}>
          🚌 <Text style={styles.boldLabel}>Transport:</Text>{" "}
          {hotel.transportProvider}
        </Text>
      ) : null}

      {hotel.transportPhone ? (
        <Text style={styles.detailText}>
          📞 <Text style={styles.boldLabel}>Transport Phone:</Text>{" "}
          {hotel.transportPhone}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
