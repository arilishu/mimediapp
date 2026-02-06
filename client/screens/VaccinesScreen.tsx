import React, { useState, useCallback, useEffect } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { VaccineRow } from "@/components/VaccineRow";
import { ChildSelector } from "@/components/ChildSelector";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ChildrenAPI, VaccinesAPI } from "@/lib/api";
import type { Child, Vaccine } from "@/types";
import type { VaccinesStackParamList } from "@/navigation/VaccinesStackNavigator";

type VaccinesScreenRouteProp = RouteProp<VaccinesStackParamList, "Vaccines">;

function parseVaccineAgeInMonths(timing: string): number | null {
  const t = timing.toLowerCase();
  
  if (t.includes("nacimiento")) return 0;
  
  const monthMatch = t.match(/(\d+)\s*mes/);
  if (monthMatch) return parseInt(monthMatch[1]);
  
  const yearMatch = t.match(/(\d+)\s*año/);
  if (yearMatch) return parseInt(yearMatch[1]) * 12;
  
  return null;
}

function getChildAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + 
                 (now.getMonth() - birth.getMonth());
  return months;
}

export default function VaccinesScreen() {
  const route = useRoute<VaccinesScreenRouteProp>();
  const initialChildId = route.params?.childId;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { userId } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Apply initial childId when navigating from dashboard
  useEffect(() => {
    if (initialChildId) {
      setSelectedChildId(initialChildId);
    }
  }, [initialChildId]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const childrenData = await ChildrenAPI.getAll(userId);
      setChildren(childrenData);

      if (childrenData.length > 0 && !selectedChildId && !initialChildId) {
        setSelectedChildId(childrenData[0].id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedChildId, userId, initialChildId]);

  const loadVaccines = useCallback(async () => {
    if (!selectedChildId) {
      setVaccines([]);
      return;
    }

    try {
      const vaccinesData = await VaccinesAPI.getByChildId(selectedChildId);
      setVaccines(vaccinesData);
    } catch (error) {
      console.error("Error loading vaccines:", error);
    }
  }, [selectedChildId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useFocusEffect(
    useCallback(() => {
      loadVaccines();
    }, [loadVaccines])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
    loadVaccines();
  };

  const handleToggleVaccine = async (vaccine: Vaccine) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = {
      isApplied: !vaccine.isApplied,
      appliedDate: !vaccine.isApplied ? new Date().toISOString() : undefined,
    };
    await VaccinesAPI.update(vaccine.id, updated);
    loadVaccines();
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const appliedVaccines = vaccines.filter((v) => v.isApplied);
  const pendingVaccines = vaccines.filter((v) => !v.isApplied);
  
  const pastDueVaccines = selectedChild 
    ? pendingVaccines.filter((v) => {
        const vaccineAge = parseVaccineAgeInMonths(v.recommendedAge);
        const childAge = getChildAgeInMonths(selectedChild.birthDate);
        return vaccineAge !== null && vaccineAge < childAge;
      })
    : [];

  const handleMarkPastVaccinesApplied = async () => {
    if (!selectedChild || pastDueVaccines.length === 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await Promise.all(
      pastDueVaccines.map((v) =>
        VaccinesAPI.update(v.id, {
          isApplied: true,
          appliedDate: new Date().toISOString(),
        })
      )
    );
    
    loadVaccines();
  };

  const renderItem = ({ item }: { item: Vaccine }) => (
    <VaccineRow vaccine={item} onToggle={() => handleToggleVaccine(item)} />
  );

  const renderEmpty = () => {
    if (children.length === 0) {
      return (
        <EmptyState
          image={require("../../assets/images/illustrations/empty_children_teddy_bear.png")}
          title="Agrega un familiar primero"
          subtitle="Para ver el calendario de vacunas necesitas agregar un familiar"
        />
      );
    }

    return (
      <EmptyState
        image={require("../../assets/images/illustrations/empty_visits_calendar_stethoscope.png")}
        title="Sin vacunas registradas"
        subtitle="Las vacunas se agregan automaticamente al crear un familiar"
      />
    );
  };

  const renderHeader = () => (
    <View>
      {children.length > 0 ? (
        <View style={styles.header}>
          <ChildSelector
            children={children}
            selectedChildId={selectedChildId}
            onSelect={setSelectedChildId}
          />
        </View>
      ) : null}

      {vaccines.length > 0 ? (
        <View style={styles.stats}>
          <View style={[styles.statCard, { backgroundColor: theme.success + "20" }]}>
            <ThemedText type="h3" style={{ color: theme.success }}>
              {appliedVaccines.length}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.success }}>
              Aplicadas
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.accent + "20" }]}>
            <ThemedText type="h3" style={{ color: theme.accent }}>
              {pendingVaccines.length}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.accent }}>
              Pendientes
            </ThemedText>
          </View>
        </View>
      ) : null}

      {pendingVaccines.length > 0 ? (
        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Pendientes</ThemedText>
          {pastDueVaccines.length > 0 ? (
            <Pressable
              onPress={handleMarkPastVaccinesApplied}
              style={[styles.markAllButton, { backgroundColor: theme.primary + "15" }]}
              testID="button-mark-past-vaccines"
            >
              <Feather name="check-circle" size={14} color={theme.primary} />
              <ThemedText type="small" style={{ color: theme.primary }}>
                Marcar anteriores ({pastDueVaccines.length})
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  const sortedVaccines = [...pendingVaccines, ...appliedVaccines];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={sortedVaccines}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing["2xl"],
          },
          vaccines.length === 0 && styles.emptyContainer,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    marginBottom: Spacing.lg,
  },
  stats: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
});
