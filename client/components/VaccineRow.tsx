import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Vaccine } from "@/types";
import { formatDateShort } from "@/lib/utils";

interface VaccineRowProps {
  vaccine: Vaccine;
  onToggle: () => void;
  onPress?: () => void;
}

export function VaccineRow({ vaccine, onToggle, onPress }: VaccineRowProps) {
  const { theme } = useTheme();

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <Pressable
        onPress={handleToggle}
        style={[
          styles.checkbox,
          {
            backgroundColor: vaccine.isApplied
              ? theme.success
              : "transparent",
            borderColor: vaccine.isApplied ? theme.success : theme.border,
          },
        ]}
      >
        {vaccine.isApplied ? (
          <Feather name="check" size={14} color="#FFFFFF" />
        ) : null}
      </Pressable>
      <View style={styles.content}>
        <ThemedText
          type="body"
          style={[
            styles.name,
            vaccine.isApplied && { textDecorationLine: "line-through" },
          ]}
        >
          {vaccine.name}
        </ThemedText>
        <ThemedText
          type="small"
          style={[styles.age, { color: theme.textSecondary }]}
        >
          {vaccine.recommendedAge}
        </ThemedText>
      </View>
      {vaccine.isApplied && vaccine.appliedDate ? (
        <View style={[styles.dateBadge, { backgroundColor: theme.success + "20" }]}>
          <ThemedText
            type="caption"
            style={[styles.dateText, { color: theme.success }]}
          >
            {formatDateShort(vaccine.appliedDate)}
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.pendingBadge, { backgroundColor: theme.accent + "20" }]}>
          <View style={[styles.pendingDot, { backgroundColor: theme.accent }]} />
          <ThemedText
            type="caption"
            style={[styles.pendingText, { color: theme.accent }]}
          >
            Pendiente
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    fontWeight: "500",
  },
  age: {},
  dateBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  dateText: {
    fontWeight: "600",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pendingText: {
    fontWeight: "600",
  },
});
