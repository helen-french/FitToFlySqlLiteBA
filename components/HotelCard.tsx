/**
 * HotelCard
 *
 * Presentational hotel contract card for Tools → Hotels / Hotel modal.
 */

import React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { StationIataBadge } from "@/components/ui/StationIataBadge";
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
  const isDark = useColorScheme() === "dark";
  const colors = {
    cardBg: isDark ? "#1C1C1E" : "#FFFFFF",
    border: isDark ? "rgba(72, 72, 74, 0.75)" : "#E9ECEF",
    text: isDark ? "#FFFFFF" : "#212529",
    body: isDark ? "#C7C7CC" : "#495057",
    label: isDark ? "#E5E5EA" : "#343A40",
    accent: "#228BE6",
    divider: isDark ? "rgba(72, 72, 74, 0.75)" : "#E9ECEF",
  };

  return (
    <View
      style={[
        styles.hotelCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.hotelName, { color: colors.text }]}>
          {hotel.name}
        </Text>
        <StationIataBadge code={hotel.iata} />
      </View>

      {hotel.crew ? (
        <Text style={[styles.crewTag, { color: colors.body }]}>
          👥 Group: {hotel.crew}
        </Text>
      ) : null}

      {hotel.address ? (
        <Text style={[styles.addressText, { color: colors.body }]}>
          📍 {hotel.address}
        </Text>
      ) : null}

      {hotel.tel ? (
        <TouchableOpacity
          style={styles.phoneAction}
          onPress={() => handlePhoneCall(hotel.tel!)}
          accessibilityRole="link"
          accessibilityLabel={`Call hotel ${hotel.tel}`}
        >
          <Text style={[styles.phoneText, { color: colors.accent }]}>
            📞 Hotel Phone: {hotel.tel}
          </Text>
        </TouchableOpacity>
      ) : null}

      {hotel.email ? (
        <Text style={[styles.emailText, { color: colors.accent }]}>
          ✉️ <Text style={[styles.boldEmailLabel, { color: colors.accent }]}>Hotel Email:</Text>{" "}
          {hotel.email}
        </Text>
      ) : null}

      {hotel.host === true ? (
        <Text style={[styles.detailText, { color: colors.body }]}>
          🏢 <Text style={[styles.boldLabel, { color: colors.label }]}>Host Hotel:</Text> Yes
        </Text>
      ) : null}

      {hotel.internet ? (
        <Text style={[styles.detailText, { color: colors.body }]}>
          📶 <Text style={[styles.boldLabel, { color: colors.label }]}>Internet:</Text>{" "}
          {hotel.internet}
        </Text>
      ) : null}

      {hotel.healthClub ? (
        <Text style={[styles.detailText, { color: colors.body }]}>
          🏋️‍♂️ <Text style={[styles.boldLabel, { color: colors.label }]}>Gym/Health Club:</Text>{" "}
          {hotel.healthClub}
        </Text>
      ) : null}

      {hotel.discountsAvailable ? (
        <Text style={[styles.detailText, { color: colors.body }]}>
          🏷️ <Text style={[styles.boldLabel, { color: colors.label }]}>Discounts:</Text>{" "}
          {hotel.discountsAvailable}
        </Text>
      ) : null}

      {hotel.comments ? (
        <Text style={[styles.commentText, { color: colors.body }]}>
          📝 Note: {hotel.comments}
        </Text>
      ) : null}

      {(hotel.transportProvider || hotel.transportPhone) && (
        <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />
      )}

      {hotel.transportProvider ? (
        <Text style={[styles.detailText, { color: colors.body }]}>
          🚌 <Text style={[styles.boldLabel, { color: colors.label }]}>Transport:</Text>{" "}
          {hotel.transportProvider}
        </Text>
      ) : null}

      {hotel.transportPhone ? (
        <Text style={[styles.detailText, { color: colors.body }]}>
          📞 <Text style={[styles.boldLabel, { color: colors.label }]}>Transport Phone:</Text>{" "}
          {hotel.transportPhone}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hotelCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
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
    fontFamily: "GoogleSansBold",
    flex: 1,
    marginRight: 6,
  },
  crewTag: {
    fontSize: 12,
    fontFamily: "GoogleSans",
    fontWeight: "500",
    marginBottom: 6,
  },
  addressText: {
    fontSize: 13,
    fontFamily: "GoogleSans",
    lineHeight: 18,
    marginBottom: 4,
  },
  cardDivider: {
    height: 1,
    marginVertical: 10,
  },
  detailText: {
    fontSize: 13,
    fontFamily: "GoogleSans",
    marginTop: 5,
    lineHeight: 18,
  },
  emailText: {
    fontSize: 13,
    fontFamily: "GoogleSans",
    marginBottom: 8,
    lineHeight: 18,
  },
  boldLabel: {
    fontFamily: "GoogleSansBold",
  },
  boldEmailLabel: {
    fontFamily: "GoogleSansBold",
  },
  phoneAction: {
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 13,
    fontFamily: "GoogleSansBold",
    lineHeight: 18,
  },
  commentText: {
    fontSize: 13,
    fontFamily: "GoogleSans",
    marginTop: 5,
    lineHeight: 18,
  },
});
