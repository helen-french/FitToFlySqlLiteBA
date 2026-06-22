import { Stack } from "expo-router";
import React from "react";

export default function HotelStackLayout() {
  //return <Stack screenOptions={{ headerShown: false }} />;
  return <Stack />; // ──✅ Native title headers enabled so <Header /> properties function properly
}
