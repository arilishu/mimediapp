import React, { useState } from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
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
  onShare?: () => void;
  onEdit?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChildCard({ child, onPress, onShare, onEdit }: ChildCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const [menuVisible, setMenuVisible] = useState(false);

  const tintColor = getChildTintColor(child.avatarIndex, theme);
  const age = calculateAge(child.birthDate);
  const isShared = child.isShared === true;

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

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuVisible(true);
  };

  const handleSharePress = () => {
    setMenuVisible(false);
    if (onShare) {
      onShare();
    }
  };

  const handleEditPress = () => {
    setMenuVisible(false);
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <>
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
        {!isShared ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleMenuPress();
            }}
            style={styles.menuButton}
            hitSlop={16}
            testID="button-child-menu"
          >
            <Feather name="more-vertical" size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}

        {isShared ? (
          <View style={[styles.sharedBadge, { backgroundColor: theme.info + "20" }]}>
            <Feather name="users" size={12} color={theme.info} />
          </View>
        ) : null}

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
        {child.isReadOnly ? (
          <View style={[styles.readOnlyBadge, { backgroundColor: theme.warning + "20" }]}>
            <Feather name="eye" size={12} color={theme.warning} />
            <ThemedText type="small" style={{ color: theme.warning }}>
              Solo lectura
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.button, { backgroundColor: theme.primary + "20" }]}>
            <ThemedText
              type="small"
              style={[styles.buttonText, { color: theme.primary }]}
            >
              Ver perfil
            </ThemedText>
            <Feather name="chevron-right" size={14} color={theme.primary} />
          </View>
        )}
      </AnimatedPressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: theme.backgroundDefault }]}>
            <Pressable
              onPress={handleEditPress}
              style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
            >
              <Feather name="edit-2" size={20} color={theme.text} />
              <ThemedText type="body">Editar datos</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSharePress}
              style={styles.menuItem}
            >
              <Feather name="share-2" size={20} color={theme.text} />
              <ThemedText type="body">Compartir hijo</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
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
  menuButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
    zIndex: 1,
  },
  sharedBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
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
  readOnlyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  menuContainer: {
    width: "80%",
    maxWidth: 300,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
});
