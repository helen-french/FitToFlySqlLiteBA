import React from "react";
import { Text, View } from "react-native";

export default function HotelIndexPlaceholder() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
      }}
    >
      <Text style={{ color: "#868e96", fontStyle: "italic" }}>
        Hotel Search Content Placeholder
      </Text>
    </View>
  );
}
