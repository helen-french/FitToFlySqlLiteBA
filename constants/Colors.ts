/* Contains the list of all colors available in the app, 
categorized by theme (light/dark) and specific usage (e.g., localTime vs. zuluTime). */

const Colors = {
  easyOrange: "#f60",
  virginRed: "#e4181e",
  baBlue: "#1c0672",
  ftfBlue: "#007AFF",
};

const tintColorLight = "#2f95dc";
const tintColorDark = "#fff";

export default {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
    localTime: "#34C759",
    zuluTime: "#666666",
    ...Colors, // This means depending on theme i can do this useColorScheme() === 'dark' ? Colors.dark.easyOrange : Colors.light.easyOrange
  },
  dark: {
    text: "#fff",
    background: "#000",
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
    localTime: "#34C759",
    zuluTime: "#A0A0A0",
    ...Colors,
  },
};
