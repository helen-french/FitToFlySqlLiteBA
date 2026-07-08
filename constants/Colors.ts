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
    // Slightly darker than system green (#34C759) for readable Local time text.
    // Toggle / timeline accent can stay brighter; text uses this token.
    localTime: "#248A3D",
    zuluTime: "#666666",
    ...Colors, // This means depending on theme i can do this useColorScheme() === 'dark' ? Colors.dark.easyOrange : Colors.light.easyOrange
  },
  dark: {
    text: "#fff",
    background: "#000",
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
    // A touch brighter than light so it stays readable on dark cards.
    localTime: "#30B04A",
    zuluTime: "#A0A0A0",
    ...Colors,
  },
};
