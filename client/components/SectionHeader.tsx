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
}

export function SectionHeader({
  title,
  onSeeMore,
  showSeeMore = true,
}: SectionHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="h4" style={styles.title}>
        {title}
      </ThemedText>
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
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  buttonText: {
    fontWeight: "600",
  },
});
