import React, { useState } from "react";
import {
  View,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useUser, useClerk } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export function UserAvatarMenu() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [menuVisible, setMenuVisible] = useState(false);

  const performSignOut = async () => {
    try {
      setMenuVisible(false);
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      if (window.confirm("¿Estás seguro que deseas cerrar sesión?")) {
        performSignOut();
      }
    } else {
      Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro que deseas cerrar sesión?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cerrar Sesión",
            style: "destructive",
            onPress: performSignOut,
          },
        ]
      );
    }
  };

  const userInitials = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || "U";

  const userName =
    user?.fullName ||
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Usuario";

  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <>
      <Pressable
        onPress={() => setMenuVisible(true)}
        hitSlop={8}
        testID="button-user-menu"
        style={styles.avatarButton}
      >
        {user?.imageUrl ? (
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
        ) : (
          <View
            style={[styles.avatarFallback, { backgroundColor: theme.primary }]}
          >
            <ThemedText type="small" style={styles.avatarText}>
              {userInitials}
            </ThemedText>
          </View>
        )}
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.menu,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.userInfo}>
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={styles.menuAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.menuAvatarFallback,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <ThemedText type="h3" style={styles.avatarText}>
                    {userInitials}
                  </ThemedText>
                </View>
              )}
              <View style={styles.userDetails}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {userName}
                </ThemedText>
                {userEmail ? (
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    {userEmail}
                  </ThemedText>
                ) : null}
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: theme.border }]}
            />

            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: theme.backgroundSecondary },
              ]}
              testID="button-signout"
            >
              <Feather name="log-out" size={18} color={theme.error} />
              <ThemedText type="body" style={{ color: theme.error }}>
                Cerrar Sesión
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarButton: {
    borderRadius: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: Spacing.lg,
  },
  menu: {
    minWidth: 240,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  menuAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
