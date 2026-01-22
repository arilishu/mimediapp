import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { DoctorsAPI } from "@/lib/api";
import type { Doctor } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DoctorsListScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await DoctorsAPI.getAll(userId);
      setDoctors(data);
    } catch (error) {
      console.error("Error loading doctors:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AddDoctor", {});
  };

  const handleEdit = (doctor: Doctor) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AddDoctor", { doctorId: doctor.id });
  };

  const performDelete = async (doctor: Doctor) => {
    try {
      await DoctorsAPI.delete(doctor.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } catch (error) {
      console.error("Error deleting doctor:", error);
    }
  };

  const handleDelete = (doctor: Doctor) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const message = `¿Estás seguro de eliminar al Dr. ${doctor.name}?`;
    
    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        performDelete(doctor);
      }
    } else {
      Alert.alert(
        "Eliminar Médico",
        message,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => performDelete(doctor),
          },
        ]
      );
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Médicos",
      headerRight: () => (
        <Pressable onPress={handleAdd} hitSlop={8} style={{ marginRight: Spacing.lg }}>
          <Feather name="plus" size={24} color={theme.primary} />
        </Pressable>
      ),
    });
  }, [navigation, theme.primary]);

  const renderItem = ({ item }: { item: Doctor }) => (
    <Pressable
      style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => handleEdit(item)}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="user" size={20} color={theme.primary} />
        </View>
        <View style={styles.textContent}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            Dr. {item.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.specialty}
          </ThemedText>
          {item.phone ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.phone}
            </ThemedText>
          ) : null}
        </View>
      </View>
      <Pressable
        onPress={() => handleDelete(item)}
        hitSlop={8}
        style={[styles.deleteButton, { backgroundColor: theme.error + "15" }]}
      >
        <Feather name="trash-2" size={18} color={theme.error} />
      </Pressable>
    </Pressable>
  );

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/illustrations/empty_visits_calendar_stethoscope.png")}
      title="Sin médicos"
      subtitle="Agrega los médicos de tu familia para agendar visitas y turnos"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
          doctors.length === 0 && styles.emptyContainer,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
      />

      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary, bottom: tabBarHeight + Spacing.lg }]}
        onPress={handleAdd}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: {
    flex: 1,
  },
  deleteButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
