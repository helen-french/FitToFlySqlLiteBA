import { Stack } from "expo-router";

/**
 * Tools stack: hub + pushed tool screens.
 *
 * Route pattern — thin files in `app/(tabs)/(tools)/<name>.tsx` re-export
 * screen components from `components/<feature>/` (e.g. hotels, notes).
 */
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
