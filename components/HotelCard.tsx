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
    border: isDark ? "rgba(72, 72, 74, 0.75)" : "#E5E5EA",
    text: isDark ? "#FFFFFF" : "#1A1A1A",
    subText: isDark ? "#A0A0A0" : "#666666",
    accent: "#007AFF",
    divider: isDark ? "rgba(72, 72, 74, 0.75)" : "#EFEFF4",
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
        <Text style={[styles.metaLine, { color: colors.subText }]}>
          Group · {hotel.crew}
        </Text>
      ) : null}

      {hotel.address ? (
        <Text style={[styles.bodyLine, { color: colors.subText }]}>
          {hotel.address}
        </Text>
      ) : null}

      {hotel.tel ? (
        <TouchableOpacity
          style={styles.phoneAction}
          onPress={() => handlePhoneCall(hotel.tel!)}
          accessibilityRole="link"
          accessibilityLabel={`Call hotel ${hotel.tel}`}
        >
          <Text style={[styles.linkText, { color: colors.accent }]}>
            {hotel.tel}
          </Text>
        </TouchableOpacity>
      ) : null}

      {hotel.email ? (
        <Text style={[styles.bodyLine, { color: colors.subText }]}>
          {hotel.email}
        </Text>
      ) : null}

      {hotel.host === true ? (
        <Text style={[styles.bodyLine, { color: colors.subText }]}>
          Host hotel
        </Text>
      ) : null}

      {hotel.internet ? (
        <Text style={[styles.bodyLine, { color: colors.subText }]}>
          Internet · {hotel.internet}
        </Text>
      ) : null}

      {hotel.healthClub ? (
        <Text style={[styles.bodyLine, { color: colors.subText }]}>
          Gym · {hotel.healthClub}
        </Text>
      ) : null}

      {hotel.discountsAvailable ? (
        <Text style={[styles.bodyLine, { color: colors.subText }]}>
          Discounts · {hotel.discountsAvailable}
        </Text>
      ) : null}

      {hotel.comments ? (
        <Text style={[styles.bodyLine, { color: colors.subText }]}>
          {hotel.comments}
        </Text>
      ) : null}

      {(hotel.transportProvider || hotel.transportPhone) && (
        <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />
      )}

      {hotel.transportProvider ? (
        <Text style={[styles.bodyLine, { color: colors.subText }]}>
          Transport · {hotel.transportProvider}
        </Text>
      ) : null}

      {hotel.transportPhone ? (
        <Text style={[styles.bodyLine, { color: colors.subText }]}>
          Transport phone · {hotel.transportPhone}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hotelCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  hotelName: {
    flex: 1,
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
    lineHeight: 22,
    marginRight: 6,
  },
  metaLine: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    marginBottom: 6,
  },
  bodyLine: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  phoneAction: {
    alignSelf: "flex-start",
    marginTop: 6,
  },
  linkText: {
    fontFamily: "GoogleSansBold",
    fontSize: 14,
  },
});
