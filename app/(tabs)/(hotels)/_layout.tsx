import { Stack } from "expo-router";

export default function HotelsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerBackground: () => null,
        headerStyle: { backgroundColor: "transparent" },
        animation: "slide_from_right",
        animationDuration: 300,
        gestureEnabled: true,
      }}
    />
  );
}
