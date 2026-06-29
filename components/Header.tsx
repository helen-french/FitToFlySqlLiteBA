import { Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Image, StyleSheet, useColorScheme, View } from "react-native";
import { useAirportLoader } from "./useAirportLoader";
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

interface HeaderProps {
  onImportSuccess?: () => void;
}

export default function Header({ onImportSuccess }: HeaderProps) {
  const colorScheme = useColorScheme();

  const { importRosterFile } = useRosterLoader(onImportSuccess);
  const { importHotelFile } = useHotelLoader(onImportSuccess);
  const { importAirportData } = useAirportLoader();

  // ==========================================================================
  // MANUAL CONTROL STATION: Uncomment your target block here
  // ==========================================================================

  // --- SETTING A: HOTEL MODALITY ---
  /* const activeIcon = "building.2.fill";
  const handleRightButtonPress = () => {
    importHotelFile();
  }; */

  // --- SETTING B: AIRPORT MODALITY ---
  const activeIcon = "airplane.arrival";
  const handleRightButtonPress = () => {
    importAirportData();
  };

  // ==========================================================================

  return (
    <Stack.Screen
      options={{
        headerTransparent: true,
        headerTitle: () => (
          <Image
            source={require("@/assets/images/logos/fittofly-ultra-dark-3.png")}
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
              onTouchEnd={handleRightButtonPress}
              name={activeIcon} // Dynamically loads the building or airplane depending on your active setting above
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
