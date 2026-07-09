import { FontAwesome6 } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useAirportLoader } from "./useAirportLoader";
import { useHotelLoader } from "./useHotelLoader";
import { useRosterLoader } from "./useRosterLoader";

const styles = StyleSheet.create({
  symbol: {
    width: 25,
    height: 25,
    margin: 5,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 4,
    backgroundColor: "transparent",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
});

interface HeaderProps {
  onImportSuccess?: () => void;
  showLoadRosterAction?: boolean;
  showLoadHotelsAction?: boolean;
  showBackAction?: boolean;
  onBackPress?: () => void;
}

export default function Header({
  onImportSuccess,
  showLoadRosterAction = true,
  showLoadHotelsAction = true,
  showBackAction = false,
  onBackPress,
}: HeaderProps) {
  const { importRosterFile } = useRosterLoader(onImportSuccess);
  const { importHotelFile } = useHotelLoader(onImportSuccess);
  const { importAirportData } = useAirportLoader();

  // ==========================================================================
  // MANUAL CONTROL STATION: Uncomment your target block here
  // ==========================================================================

  // --- SETTING A: HOTEL MODALITY ---
  const activeIcon = "building.2.fill";
  const handleRightButtonPress = () => {
    importHotelFile();
  };

  // --- SETTING B: AIRPORT MODALITY ---
  /* const activeIcon = "airplane.arrival";
  const handleRightButtonPress = () => {
    importAirportData();
  }; */


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
        headerLeft: () =>
          showBackAction ? (
            <TouchableOpacity
              onPress={onBackPress}
              activeOpacity={0.7}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <FontAwesome6 name="chevron-left" size={14} color="#1C1C1E" />
            </TouchableOpacity>
          ) : showLoadRosterAction ? (
            <SymbolView
              onTouchEnd={importRosterFile}
              name="square.and.arrow.down.on.square.fill"
              style={styles.symbol}
              type="monochrome"
              weight="medium"
            />
          ) : null,
        headerRight: () =>
          showLoadHotelsAction ? (
            <View style={styles.rightActions}>
              <SymbolView
                onTouchEnd={handleRightButtonPress}
                name={activeIcon} // Dynamically loads the building or airplane depending on your active setting above
                style={styles.symbol}
                type="monochrome"
                weight="medium"
              />
            </View>
          ) : null,
      }}
    />
  );
}
