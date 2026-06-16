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

// MODIFIED DELTA: Component now accepts an optional onImportSuccess prop function
interface HeaderProps {
  onImportSuccess?: () => void;
}

export default function Header({ onImportSuccess }: HeaderProps) {
  const colorScheme = useColorScheme();

  // Pass the success prop straight into our optimized hook configuration
  const { importRosterFile } = useRosterLoader(onImportSuccess);

  return (
    <Stack.Screen
      options={{
        headerTransparent: true,
        headerTitle: () => (
          <Image
            source={
              colorScheme === "dark"
                ? require("@/assets/images/logos/fittofly-ultra-dark-3.png")
                : require("@/assets/images/logos/fittofly-ultra-dark-3.png") //require("@/assets/images/logos/fittofly-test.png")
            }
            style={{ width: 130, height: 30 }}
            resizeMode="contain"
          />
        ),
        headerLeft: () => (
          <SymbolView
            onTouchEnd={importRosterFile}
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
