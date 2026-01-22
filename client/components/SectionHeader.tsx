import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface SectionHeaderProps {
  title: string;
  onSeeMore?: () => void;
  showSeeMore?: boolean;
  onAdd?: () => void;
}

export function SectionHeader({
  title,
  onSeeMore,
  showSeeMore = true,
  onAdd,
}: SectionHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="h4" style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.actions}>
        {onAdd ? (
          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            hitSlop={8}
          >
            <Feather name="plus" size={16} color="#fff" />
          </Pressable>
        ) : null}
        {showSeeMore && onSeeMore ? (
          <Pressable
            onPress={onSeeMore}
            style={({ pressed }) => [
              styles.button,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText
              type="small"
              style={[styles.buttonText, { color: theme.primary }]}
            >
              Ver mas
            </ThemedText>
            <Feather name="chevron-right" size={16} color={theme.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  title: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  buttonText: {
    fontWeight: "600",
  },
});
