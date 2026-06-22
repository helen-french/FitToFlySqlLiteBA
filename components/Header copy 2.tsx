import { Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Image, StyleSheet, useColorScheme, View } from "react-native";
import { useHotelLoader } from "./useHotelLoader";
import { useRosterLoader } from "./useRosterLoader";

const styles = StyleSheet.create({
  symbol: {
    width: 25,
    height: 25,
    margin: 5,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
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
  const { importHotelFile } = useHotelLoader(onImportSuccess);

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

        headerRight: () => (
          <View style={styles.rightActions}>
            <SymbolView
              onTouchEnd={importHotelFile}
              name="building.2.fill"
              style={styles.symbol}
              type="monochrome"
              weight="medium"
            />
          </View>
        ),
      }}
    />
  );
}
