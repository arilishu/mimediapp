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
import { DiseasesAPI, ChildrenAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { PastDisease, Child } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useAuth } from "@clerk/clerk-expo";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "DiseasesList">;

export default function DiseasesListScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId } = useAuth();
  const { childId } = route.params;

  const [diseases, setDiseases] = useState<PastDisease[]>([]);
  const [child, setChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [diseasesData, childData] = await Promise.all([
        DiseasesAPI.getByChildId(childId),
        ChildrenAPI.getById(childId, userId),
      ]);
      setDiseases(diseasesData);
      setChild(childData);
    } catch (error) {
      console.error("Error loading diseases:", error);
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
    navigation.navigate("AddDisease", { childId });
  };

  const handleEdit = (disease: PastDisease) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AddDisease", { childId, diseaseId: disease.id });
  };

  const handleDelete = (disease: PastDisease) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Eliminar Enfermedad",
      `¿Estás seguro de eliminar "${disease.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await DiseasesAPI.delete(disease.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadData();
            } catch (error) {
              console.error("Error deleting disease:", error);
            }
          },
        },
      ]
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: child?.name ? `Enfermedades de ${child.name}` : "Enfermedades",
      headerRight: () => (
        <Pressable onPress={handleAdd} hitSlop={8}>
          <Feather name="plus" size={24} color={theme.primary} />
        </Pressable>
      ),
    });
  }, [navigation, child, theme.primary]);

  const renderItem = ({ item }: { item: PastDisease }) => (
    <Pressable
      style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => handleEdit(item)}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: theme.info + "20" }]}>
          <Feather name="thermometer" size={20} color={theme.info} />
        </View>
        <View style={styles.textContent}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {formatDate(item.date)}
          </ThemedText>
          {item.notes ? (
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
              Medicamento: {item.notes}
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
      title="Sin enfermedades previas"
      subtitle="Registra las enfermedades que el familiar tuvo"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={diseases}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
          diseases.length === 0 && styles.emptyContainer,
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
