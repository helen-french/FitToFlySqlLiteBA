import {
  Badge,
  Icon,
  Label,
  NativeTabs,
} from "expo-router/unstable-native-tabs";
import React from "react";

import { TimeModeZOrLProvider } from "@/components/TimeModeZOrL";

export default function TabLayout() {
  return (
    <TimeModeZOrLProvider>
      <NativeTabs>
        <NativeTabs.Trigger name="(roster)">
          <Label>Roster</Label>
          <Icon
            sf={{
              default: "calendar",
              selected: "calendar",
            }}
            drawable="roster"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(sectors)">
          <Label>Trip</Label>
          <Icon
            sf={{
              default: "airplane.circle",
              selected: "airplane.circle.fill",
            }}
            drawable="sectors"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(history)">
          <Label>History</Label>
          <Icon
            sf={{
              default: "clock.arrow.circlepath",
              selected: "clock.arrow.circlepath",
            }}
            drawable="history"
          />
          <Badge>2+</Badge>
        </NativeTabs.Trigger>

        {/* Settings hub kept in codebase; hide from tab bar for now.
        <NativeTabs.Trigger name="(settings)">
          <Label>Settings</Label>
          <Icon
            sf={{ default: "gear", selected: "gear" }}
            drawable="custom_settings_drawable"
          />
          <Badge>9+</Badge>
        </NativeTabs.Trigger>
        */}

        <NativeTabs.Trigger name="(tools)">
          <Label>Tools</Label>
          <Icon
            sf={{
              default: "wrench.and.screwdriver",
              selected: "wrench.and.screwdriver",
            }}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </TimeModeZOrLProvider>
  );
}
