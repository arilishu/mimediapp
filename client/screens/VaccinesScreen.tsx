import React, { useState, useCallback, useEffect } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";

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

  const appliedVaccines = vaccines.filter((v) => v.isApplied);
  const pendingVaccines = vaccines.filter((v) => !v.isApplied);

  const renderItem = ({ item }: { item: Vaccine }) => (
    <VaccineRow vaccine={item} onToggle={() => handleToggleVaccine(item)} />
  );

  const renderEmpty = () => {
    if (children.length === 0) {
      return (
        <EmptyState
          image={require("../../assets/images/illustrations/empty_children_teddy_bear.png")}
          title="Agrega un niño primero"
          subtitle="Para ver el calendario de vacunas necesitas agregar un niño"
        />
      );
    }

    return (
      <EmptyState
        image={require("../../assets/images/illustrations/empty_visits_calendar_stethoscope.png")}
        title="Sin vacunas registradas"
        subtitle="Las vacunas se agregan automaticamente al crear un niño"
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
        <ThemedText type="h4" style={styles.sectionTitle}>
          Pendientes
        </ThemedText>
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
});
