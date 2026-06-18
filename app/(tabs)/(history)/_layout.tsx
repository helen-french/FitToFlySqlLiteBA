import { Stack } from "expo-router";

export default function HistoryStackLayout() {
  //return <Stack screenOptions={{ headerShown: false }} />;
  return <Stack />; // ──✅ Native title headers enabled so <Header /> properties function properly
}
