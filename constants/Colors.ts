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
    ...Colors, // This means depending on theme i can do this useColorScheme() === 'dark' ? Colors.dark.easyOrange : Colors.light.easyOrange
  },
  dark: {
    text: "#fff",
    background: "#000",
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
    ...Colors,
  },
};
