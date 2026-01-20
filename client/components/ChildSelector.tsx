import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Child } from "@/types";

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string | null;
  onSelect: (childId: string) => void;
}

export function ChildSelector({
  children,
  selectedChildId,
  onSelect,
}: ChildSelectorProps) {
  const { theme } = useTheme();

  const handleSelect = (childId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(childId);
  };

  if (children.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {children.map((child) => {
        const isSelected = child.id === selectedChildId;
        return (
          <Pressable
            key={child.id}
            onPress={() => handleSelect(child.id)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? theme.primary
                  : theme.backgroundDefault,
                borderColor: isSelected ? theme.primary : theme.border,
              },
            ]}
          >
            <Feather
              name="user"
              size={14}
              color={isSelected ? "#FFFFFF" : theme.primary}
            />
            <ThemedText
              type="small"
              style={[
                styles.chipText,
                { color: isSelected ? "#FFFFFF" : theme.text },
              ]}
            >
              {child.name}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontWeight: "600",
  },
});
