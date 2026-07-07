import { Stack } from "expo-router";

export default function SettingsStackLayout() {
  return (
    <Stack
      screenOptions={{
        // Keep the header identical (fully transparent, no background band or
        // bottom shadow) on both the root and pushed screens so the SkyHeader
        // shows through consistently.
        //
        // `headerTransparent` alone isn't enough on iOS: pushed screens get a
        // translucent system material behind the bar, and that appearance stays
        // cached until the stack remounts (which is why switching tabs "clears"
        // it). Forcing an empty background layer stops iOS from ever drawing it.
        headerTransparent: true,
        headerShadowVisible: false,
        headerBackground: () => null,
        headerStyle: { backgroundColor: "transparent" },
        // Smooth horizontal glide when pushing/popping screens.
        animation: "slide_from_right",
        animationDuration: 300,
        gestureEnabled: true,
      }}
    />
  );
}
