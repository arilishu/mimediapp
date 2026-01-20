import React from "react";
import { View, StyleSheet, Pressable, Linking, Platform } from "react-native";
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
import { Hospital } from "@/types";

interface HospitalCardProps {
  hospital: Hospital;
  onPress?: () => void;
  onDelete?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HospitalCard({
  hospital,
  onPress,
  onDelete,
}: HospitalCardProps) {
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

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const phoneUrl = Platform.select({
      ios: `tel:${hospital.phone}`,
      android: `tel:${hospital.phone}`,
      default: `tel:${hospital.phone}`,
    });
    Linking.openURL(phoneUrl);
  };

  const handleDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const encodedAddress = encodeURIComponent(hospital.address);
    const mapsUrl = Platform.select({
      ios: `maps:?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
      default: `https://maps.google.com/?q=${encodedAddress}`,
    });
    Linking.openURL(mapsUrl);
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
        <View style={[styles.iconContainer, { backgroundColor: theme.error + "20" }]}>
          <Feather name="plus-circle" size={20} color={theme.error} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="body" style={styles.name}>
            {hospital.name}
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.address, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {hospital.address}
          </ThemedText>
        </View>
        {onDelete ? (
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="trash-2" size={18} color={theme.error} />
          </Pressable>
        ) : null}
      </View>
      {hospital.specialties.length > 0 ? (
        <View style={styles.specialties}>
          {hospital.specialties.slice(0, 3).map((specialty, index) => (
            <View
              key={index}
              style={[styles.specialtyBadge, { backgroundColor: theme.primary + "15" }]}
            >
              <ThemedText
                type="caption"
                style={[styles.specialtyText, { color: theme.primary }]}
              >
                {specialty}
              </ThemedText>
            </View>
          ))}
          {hospital.specialties.length > 3 ? (
            <ThemedText
              type="caption"
              style={[styles.moreText, { color: theme.textSecondary }]}
            >
              +{hospital.specialties.length - 3}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          onPress={handleCall}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.success + "15", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="phone" size={16} color={theme.success} />
          <ThemedText
            type="small"
            style={[styles.actionText, { color: theme.success }]}
          >
            Llamar
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={handleDirections}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.primary + "15", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="navigation" size={16} color={theme.primary} />
          <ThemedText
            type="small"
            style={[styles.actionText, { color: theme.primary }]}
          >
            Direcciones
          </ThemedText>
        </Pressable>
      </View>
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
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontWeight: "600",
    marginBottom: 2,
  },
  address: {},
  deleteButton: {
    padding: Spacing.xs,
  },
  specialties: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  specialtyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  specialtyText: {
    fontWeight: "500",
  },
  moreText: {
    alignSelf: "center",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  actionText: {
    fontWeight: "600",
  },
});
