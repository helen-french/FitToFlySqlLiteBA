import { Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Image, StyleSheet, useColorScheme } from "react-native";
import { useRosterLoader } from "./useRosterLoader";

const styles = StyleSheet.create({
  symbol: {
    width: 25,
    height: 25,
    margin: 5,
  },
});

export default function Header() {
  const colorScheme = useColorScheme();

  // Intercept our clean, one-line standalone execution method
  const { importRosterFile } = useRosterLoader();

  return (
    <Stack.Screen
      options={{
        headerTransparent: true,
        headerTitle: () => (
          <Image
            source={
              colorScheme === "dark"
                ? require("@/assets/images/logos/fittofly-ultra-dark-3.png")
                : require("@/assets/images/logos/fittofly-test.png")
            }
            style={{ width: 130, height: 30 }}
            resizeMode="contain"
          />
        ),
        headerLeft: () => (
          <SymbolView
            onTouchEnd={importRosterFile} // Beautiful, clean reference call!
            name="square.and.arrow.down.on.square.fill"
            style={styles.symbol}
            type="monochrome"
            weight="medium"
          />
        ),
      }}
    />
  );
}
