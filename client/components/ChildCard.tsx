import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Child } from "@/types";
import { calculateAge, getChildTintColor } from "@/lib/utils";

interface ChildCardProps {
  child: Child;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AVATARS = {
  male: [
    require("../../assets/images/icon.png"),
    require("../../assets/images/icon.png"),
  ],
  female: [
    require("../../assets/images/icon.png"),
    require("../../assets/images/icon.png"),
  ],
};

export function ChildCard({ child, onPress }: ChildCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const tintColor = getChildTintColor(child.avatarIndex, theme);
  const age = calculateAge(child.birthDate);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const avatarSource =
    child.sex === "male"
      ? AVATARS.male[child.avatarIndex % AVATARS.male.length]
      : AVATARS.female[child.avatarIndex % AVATARS.female.length];

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: tintColor },
        Shadows.card,
        animatedStyle,
      ]}
    >
      <View style={[styles.avatarContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Feather 
          name={child.sex === "male" ? "user" : "user"} 
          size={32} 
          color={theme.primary} 
        />
      </View>
      <ThemedText type="h4" style={styles.name} numberOfLines={1}>
        {child.name}
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.age, { color: theme.textSecondary }]}
      >
        {age}
      </ThemedText>
      <View style={[styles.button, { backgroundColor: theme.primary + "20" }]}>
        <ThemedText
          type="small"
          style={[styles.buttonText, { color: theme.primary }]}
        >
          Ver perfil
        </ThemedText>
        <Feather name="chevron-right" size={14} color={theme.primary} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    minHeight: 180,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  name: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  age: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  buttonText: {
    fontWeight: "600",
  },
});
