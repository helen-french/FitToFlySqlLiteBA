import { Ionicons } from "@expo/vector-icons";
import {
  Badge,
  Icon,
  Label,
  NativeTabs,
} from "expo-router/unstable-native-tabs";
import React from "react";
import { StyleSheet } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";

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
    <NativeTabs
    // labelStyle={{
    //   // For the text color
    //   color: DynamicColorIOS({
    //     dark: "white",
    //     light: Colors.light.ftfBlue,
    //   }),
    // }}
    // For the selected icon color
    // tintColor={DynamicColorIOS({
    //   dark: "white",
    //   light: Colors.light.ftfBlue,
    // })}
    >
      <NativeTabs.Trigger name="(home)">
        <Label>Home</Label>
        <Icon
          sf={{ default: "house", selected: "house.fill" }}
          drawable="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(details)">
        <Label>Trip</Label>
        <Icon
          sf={{
            default: "list.bullet.rectangle",
            selected: "list.bullet.rectangle.fill",
          }}
          drawable="details"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(summary)">
        <Label>Summary</Label>
        <Icon
          sf={{ default: "airplane.circle", selected: "airplane.circle.fill" }}
          drawable="summary"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(profile)">
        <Label>Profile</Label>
        <Icon
          sf={{ default: "person", selected: "person.fill" }}
          drawable="person"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <Label>Settings</Label>
        <Icon
          sf={{ default: "gear", selected: "gear" }}
          drawable="custom_settings_drawable"
        />
        <Badge>9+</Badge>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

const styles = StyleSheet.create({});
