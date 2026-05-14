import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  activeName: React.ComponentProps<typeof Ionicons>["name"];
  focused: boolean;
  color: string;
}) {
  return (
    <Ionicons
      // If focused, use the 'activeName' (filled). If not, use 'name' (outline).
      name={props.focused ? props.activeName : props.name}
      size={props.focused ? 30 : 24} // A slight size bump for the active tab
      color={props.color}
      style={{ marginBottom: -3 }}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="home-outline"
              activeName="home"
              focused={focused}
              color={color}
            />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Ionicons
                    // Switch between filled and outline when the user taps it
                    name={
                      pressed
                        ? "information-circle"
                        : "information-circle-outline"
                    }
                    size={25}
                    color={Colors[colorScheme ?? "light"].text}
                    style={{ marginRight: 15 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="person-outline"
              activeName="person"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Tab One",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="settings-outline"
              activeName="settings"
              focused={focused}
              color={color}
            />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors[colorScheme ?? "light"].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    // This makes the bar float slightly or sit at bottom
    position: "absolute",
    borderTopWidth: 0, // Removes the ugly default line
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Slight transparency
    height: 70,

    // THE GLOW:
    elevation: 20, // For Android
    shadowColor: "#4c66ff", // This is the glow, change depending on sky when have this written   const glowColor = Colours[selectedSky] || "#000";!
    shadowOffset: { width: 0, height: -10 }, // Negative height pushes glow UP
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
});
