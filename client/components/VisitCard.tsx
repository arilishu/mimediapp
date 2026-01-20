import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { MedicalVisit, Doctor } from "@/types";
import { formatDate } from "@/lib/utils";

interface VisitCardProps {
  visit: MedicalVisit;
  doctor?: Doctor;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function VisitCard({ visit, doctor, onPress }: VisitCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault },
        Shadows.card,
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="activity" size={18} color={theme.primary} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="body" style={styles.date}>
            {formatDate(visit.date)}
          </ThemedText>
          {doctor ? (
            <ThemedText
              type="small"
              style={[styles.doctor, { color: theme.textSecondary }]}
            >
              Dr. {doctor.name}
            </ThemedText>
          ) : null}
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
      <View style={styles.badges}>
        {visit.weight ? (
          <View style={[styles.badge, { backgroundColor: theme.secondary + "30" }]}>
            <ThemedText
              type="small"
              style={[styles.badgeText, { color: theme.text }]}
            >
              {visit.weight} kg
            </ThemedText>
          </View>
        ) : null}
        {visit.height ? (
          <View style={[styles.badge, { backgroundColor: theme.info + "30" }]}>
            <ThemedText
              type="small"
              style={[styles.badgeText, { color: theme.text }]}
            >
              {visit.height} cm
            </ThemedText>
          </View>
        ) : null}
        {visit.headCircumference ? (
          <View style={[styles.badge, { backgroundColor: theme.accent + "30" }]}>
            <ThemedText
              type="small"
              style={[styles.badgeText, { color: theme.text }]}
            >
              PC: {visit.headCircumference} cm
            </ThemedText>
          </View>
        ) : null}
      </View>
      {visit.notes ? (
        <ThemedText
          type="small"
          style={[styles.notes, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {visit.notes}
        </ThemedText>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  date: {
    fontWeight: "600",
  },
  doctor: {},
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontWeight: "500",
  },
  notes: {
    marginTop: Spacing.md,
  },
});
