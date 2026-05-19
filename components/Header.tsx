import { Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Image, StyleSheet, useColorScheme } from "react-native";

const styles = StyleSheet.create({
  symbol: {
    width: 25,
    height: 25,
    // color: "white",
    margin: 5,
  },
});

export default function Header() {
  const colorScheme = useColorScheme();

  const handlePresentPress = () => {
    // Handle the press event for the symbol view
    console.log("SymbolView pressed!");
  };

  return (
    <Stack.Screen
      options={{
        headerTransparent: true,
        headerTitle: () => (
          <Image
            source={
              colorScheme === "dark"
                ? require("@/assets/images/logos/fittofly-ultra-dark-3.png") // Dark theme image
                : require("@/assets/images/logos/fittofly-test.png") // Light theme image
            }
            style={{ width: 130, height: 30 }}
            resizeMode="contain"
          />
        ),
        headerLeft: () => (
          <SymbolView
            onTouchEnd={handlePresentPress}
            name="square.and.arrow.down.on.square.fill"
            style={styles.symbol}
            type="monochrome"
            // tintColor={"white"}
            weight="medium"
          />
        ),
      }}
    />
  );
}
