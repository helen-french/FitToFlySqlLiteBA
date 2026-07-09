import { Stack } from "expo-router";

export default function ToolsStackLayout() {
  return (
    <Stack
      screenOptions={{
        // Keep tool sub-screens in the same visual shell as the tab roots.
        // Header content is provided by <Header /> via TabScreenLayout.
        headerBackVisible: false,
      }}
    />
  );
}
