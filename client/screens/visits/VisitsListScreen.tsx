import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { VisitsAPI, ChildrenAPI, DoctorsAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { MedicalVisit, Child, Doctor } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useAuth } from "@clerk/clerk-expo";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "VisitsList">;

export default function VisitsListScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId } = useAuth();
  const { childId } = route.params;

  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [child, setChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [visitsData, childData, doctorsData] = await Promise.all([
        VisitsAPI.getByChildId(childId),
        ChildrenAPI.getById(childId, userId),
        DoctorsAPI.getAll(userId),
      ]);
      setVisits(visitsData);
      setChild(childData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error("Error loading visits:", error);
    } finally {
      setIsLoading(false);
    }
  }, [childId, userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor ? `Dr. ${doctor.name}` : "";
  };

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AddVisit", { childId });
  };

  const handleEdit = (visit: MedicalVisit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AddVisit", { childId, visitId: visit.id });
  };

  const handleDelete = (visit: MedicalVisit) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Eliminar Visita",
      `¿Estás seguro de eliminar la visita del ${formatDate(visit.date)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await VisitsAPI.delete(visit.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadData();
            } catch (error) {
              console.error("Error deleting visit:", error);
            }
          },
        },
      ]
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: child?.name ? `Visitas de ${child.name}` : "Visitas Médicas",
      headerRight: () => (
        <Pressable onPress={handleAdd} hitSlop={8}>
          <Feather name="plus" size={24} color={theme.primary} />
        </Pressable>
      ),
    });
  }, [navigation, child, theme.primary]);

  const renderItem = ({ item }: { item: MedicalVisit }) => (
    <Pressable
      style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => handleEdit(item)}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="activity" size={20} color={theme.primary} />
        </View>
        <View style={styles.textContent}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {formatDate(item.date)}
          </ThemedText>
          {item.doctorId ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {getDoctorName(item.doctorId)}
            </ThemedText>
          ) : null}
          <View style={styles.badges}>
            {item.weight ? (
              <View style={[styles.badge, { backgroundColor: theme.secondary + "30" }]}>
                <ThemedText type="small">{item.weight} kg</ThemedText>
              </View>
            ) : null}
            {item.height ? (
              <View style={[styles.badge, { backgroundColor: theme.info + "30" }]}>
                <ThemedText type="small">{item.height} cm</ThemedText>
              </View>
            ) : null}
            {item.headCircumference ? (
              <View style={[styles.badge, { backgroundColor: theme.accent + "30" }]}>
                <ThemedText type="small">PC: {item.headCircumference} cm</ThemedText>
              </View>
            ) : null}
          </View>
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
      image={require("../../../assets/images/illustrations/empty_visits_calendar_stethoscope.png")}
      title="Sin visitas médicas"
      subtitle="Registra las consultas médicas del familiar"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
          visits.length === 0 && styles.emptyContainer,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
      />

      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary, bottom: insets.bottom + Spacing.xl }]}
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
    alignItems: "flex-start",
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
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  deleteButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
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
