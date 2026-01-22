import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";

import { VisitCard } from "@/components/VisitCard";
import { ChildSelector } from "@/components/ChildSelector";
import { EmptyState } from "@/components/EmptyState";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { ChildrenAPI, VisitsAPI, DoctorsAPI } from "@/lib/api";
import type { Child, MedicalVisit, Doctor } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function VisitsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [doctors, setDoctors] = useState<Record<string, Doctor>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const [childrenData, doctorsData] = await Promise.all([
        ChildrenAPI.getAll(userId),
        DoctorsAPI.getAll(userId),
      ]);

      setChildren(childrenData);
      setDoctors(doctorsData.reduce((acc, doc) => ({ ...acc, [doc.id]: doc }), {}));

      if (childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedChildId, userId]);

  const loadVisits = useCallback(async () => {
    if (!selectedChildId) {
      setVisits([]);
      return;
    }

    try {
      const visitsData = await VisitsAPI.getByChildId(selectedChildId);
      setVisits(visitsData);
    } catch (error) {
      console.error("Error loading visits:", error);
    }
  }, [selectedChildId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useFocusEffect(
    useCallback(() => {
      loadVisits();
    }, [loadVisits])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
    loadVisits();
  };

  const handleAddVisit = () => {
    if (!selectedChildId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("AddVisit", { childId: selectedChildId });
  };

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
  };

  const renderItem = ({ item }: { item: MedicalVisit }) => (
    <VisitCard visit={item} doctor={doctors[item.doctorId]} />
  );

  const renderEmpty = () => {
    if (children.length === 0) {
      return (
        <EmptyState
          image={require("../../assets/images/illustrations/empty_visits_calendar_stethoscope.png")}
          title="Agrega un familiar primero"
          subtitle="Para registrar visitas medicas necesitas agregar un familiar"
        />
      );
    }

    return (
      <EmptyState
        image={require("../../assets/images/illustrations/empty_visits_calendar_stethoscope.png")}
        title="Sin visitas registradas"
        subtitle="Agrega la primera visita medica"
        buttonText="Agregar Visita"
        onButtonPress={handleAddVisit}
      />
    );
  };

  const renderHeader = () => {
    if (children.length === 0) return null;

    return (
      <View style={styles.header}>
        <ChildSelector
          children={children}
          selectedChildId={selectedChildId}
          onSelect={handleChildSelect}
        />
      </View>
    );
  };

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
            paddingBottom: tabBarHeight + Spacing["5xl"],
          },
          visits.length === 0 && styles.emptyContainer,
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
      {selectedChildId && children.length > 0 ? (
        <FloatingActionButton
          onPress={handleAddVisit}
          style={{
            bottom: tabBarHeight + Spacing.xl,
            right: Spacing.xl,
          }}
        />
      ) : null}
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
});
