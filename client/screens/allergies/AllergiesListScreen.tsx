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
import { AllergiesAPI, ChildrenAPI } from "@/lib/api";
import type { Allergy, Child } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useAuth } from "@clerk/clerk-expo";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "AllergiesList">;

export default function AllergiesListScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId } = useAuth();
  const { childId } = route.params;

  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [child, setChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [allergiesData, childData] = await Promise.all([
        AllergiesAPI.getByChildId(childId),
        ChildrenAPI.getById(childId, userId),
      ]);
      setAllergies(allergiesData);
      setChild(childData);
    } catch (error) {
      console.error("Error loading allergies:", error);
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
    navigation.navigate("AddAllergy", { childId });
  };

  const handleEdit = (allergy: Allergy) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AddAllergy", { childId, allergyId: allergy.id });
  };

  const handleDelete = (allergy: Allergy) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Eliminar Alergia",
      `¿Estás seguro de eliminar "${allergy.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await AllergiesAPI.delete(allergy.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadData();
            } catch (error) {
              console.error("Error deleting allergy:", error);
            }
          },
        },
      ]
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: child?.name ? `Alergias de ${child.name}` : "Alergias",
      headerRight: () => (
        <Pressable onPress={handleAdd} hitSlop={8}>
          <Feather name="plus" size={24} color={theme.primary} />
        </Pressable>
      ),
    });
  }, [navigation, child, theme.primary]);

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "severe":
        return theme.error;
      case "moderate":
        return theme.accent;
      default:
        return theme.warning;
    }
  };

  const renderItem = ({ item }: { item: Allergy }) => {
    const severityColor = getSeverityColor(item.severity);
    return (
      <Pressable
        style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        onPress={() => handleEdit(item)}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: severityColor + "20" }]}>
            <Feather name="alert-circle" size={20} color={severityColor} />
          </View>
          <View style={styles.textContent}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {item.name}
            </ThemedText>
            {item.severity ? (
              <ThemedText type="small" style={{ color: severityColor }}>
                {item.severity === "severe" ? "Severa" : item.severity === "moderate" ? "Moderada" : "Leve"}
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
  };

  const renderEmpty = () => (
    <EmptyState
      image={require("../../../assets/images/illustrations/empty_visits_calendar_stethoscope.png")}
      title="Sin alergias"
      subtitle="Registra las alergias conocidas del familiar"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={allergies}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
          allergies.length === 0 && styles.emptyContainer,
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
