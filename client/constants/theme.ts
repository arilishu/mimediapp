import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#2C3E50",
    textSecondary: "#6B7C93",
    textDisabled: "#A5B3C7",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B7C93",
    tabIconSelected: "#6BA5CF",
    link: "#6BA5CF",
    primary: "#6BA5CF",
    secondary: "#A8D5BA",
    accent: "#FFB84D",
    success: "#5FB894",
    warning: "#FFB84D",
    error: "#E07A7A",
    info: "#6BA5CF",
    backgroundRoot: "#F8FAFB",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F0F4F8",
    backgroundTertiary: "#E5EAF0",
    border: "#E5EAF0",
    borderFocus: "#6BA5CF",
    childTint1: "#E8F4F8",
    childTint2: "#F0F8E8",
    childTint3: "#FFF4E6",
    childTint4: "#F8E8F4",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    textDisabled: "#687076",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#6BA5CF",
    link: "#6BA5CF",
    primary: "#6BA5CF",
    secondary: "#A8D5BA",
    accent: "#FFB84D",
    success: "#5FB894",
    warning: "#FFB84D",
    error: "#E07A7A",
    info: "#6BA5CF",
    backgroundRoot: "#1A1D21",
    backgroundDefault: "#242830",
    backgroundSecondary: "#2E333A",
    backgroundTertiary: "#383E47",
    border: "#383E47",
    borderFocus: "#6BA5CF",
    childTint1: "#1E3A4A",
    childTint2: "#2A3E2E",
    childTint3: "#3E3528",
    childTint4: "#3A2E3E",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "Nunito_700Bold",
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    fontFamily: "Nunito_700Bold",
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    fontFamily: "Nunito_600SemiBold",
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
    fontFamily: "Nunito_600SemiBold",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "Nunito_400Regular",
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    fontFamily: "Nunito_400Regular",
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "Nunito_400Regular",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    fontFamily: "Nunito_400Regular",
  },
};

export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Nunito_400Regular",
    serif: "ui-serif",
    rounded: "Nunito_400Regular",
    mono: "ui-monospace",
  },
  default: {
    sans: "Nunito_400Regular",
    serif: "serif",
    rounded: "Nunito_400Regular",
    mono: "monospace",
  },
  web: {
    sans: "Nunito, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "Nunito, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
