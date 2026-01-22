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
import { MedicationsAPI, ChildrenAPI } from "@/lib/api";
import type { Medication, Child } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useAuth } from "@clerk/clerk-expo";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "MedicationsList">;

export default function MedicationsListScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId } = useAuth();
  const { childId } = route.params;

  const [medications, setMedications] = useState<Medication[]>([]);
  const [child, setChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [medicationsData, childData] = await Promise.all([
        MedicationsAPI.getByChildId(childId),
        ChildrenAPI.getById(childId, userId),
      ]);
      setMedications(medicationsData);
      setChild(childData);
    } catch (error) {
      console.error("Error loading medications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [childId, userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AddMedication", { childId });
  };

  const handleEdit = (medication: Medication) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AddMedication", { childId, medicationId: medication.id });
  };

  const handleDelete = (medication: Medication) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Eliminar Medicamento",
      `¿Estás seguro de eliminar "${medication.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await MedicationsAPI.delete(medication.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadData();
            } catch (error) {
              console.error("Error deleting medication:", error);
            }
          },
        },
      ]
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: child?.name ? `Medicamentos de ${child.name}` : "Medicamentos",
      headerRight: () => (
        <Pressable onPress={handleAdd} hitSlop={8}>
          <Feather name="plus" size={24} color={theme.primary} />
        </Pressable>
      ),
    });
  }, [navigation, child, theme.primary]);

  const renderItem = ({ item }: { item: Medication }) => (
    <Pressable
      style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => handleEdit(item)}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: theme.secondary + "20" }]}>
          <Feather name="package" size={20} color={theme.secondary} />
        </View>
        <View style={styles.textContent}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {item.name}
          </ThemedText>
          {item.symptom ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.symptom}
            </ThemedText>
          ) : null}
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.dose}
          </ThemedText>
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
      title="Sin medicamentos"
      subtitle="Agrega los medicamentos frecuentes de tu hijo"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
          medications.length === 0 && styles.emptyContainer,
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
