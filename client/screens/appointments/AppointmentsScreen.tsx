import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";

import { AppointmentCard } from "@/components/AppointmentCard";
import { EmptyState } from "@/components/EmptyState";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { ChildrenAPI, AppointmentsAPI, DoctorsAPI } from "@/lib/api";
import { isFuture } from "@/lib/utils";
import type { Child, Appointment, Doctor } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Record<string, Doctor>>({});
  const [childrenMap, setChildrenMap] = useState<Record<string, Child>>({});
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
      setChildrenMap(
        childrenData.reduce((acc, child) => ({ ...acc, [child.id]: child }), {})
      );
      setDoctors(
        doctorsData.reduce((acc, doc) => ({ ...acc, [doc.id]: doc }), {})
      );

      // Load appointments for all children
      const allAppointments: Appointment[] = [];
      for (const child of childrenData) {
        const childAppointments = await AppointmentsAPI.getByChildId(child.id);
        allAppointments.push(...childAppointments);
      }

      const upcomingAppointments = allAppointments
        .filter((a) => isFuture(a.date))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setAppointments(upcomingAppointments);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleAddAppointment = () => {
    if (children.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("AddAppointment", { childId: children[0].id });
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await AppointmentsAPI.delete(appointmentId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderItem = ({ item }: { item: Appointment }) => (
    <AppointmentCard
      appointment={item}
      doctor={item.doctorId ? doctors[item.doctorId] : undefined}
      child={childrenMap[item.childId]}
      onDelete={() => handleDeleteAppointment(item.id)}
    />
  );

  const renderEmpty = () => {
    if (children.length === 0) {
      return (
        <EmptyState
          image={require("../../../assets/images/illustrations/empty_appointments_clock_checkmark.png")}
          title="Agrega un familiar primero"
          subtitle="Para agendar turnos medicos necesitas agregar un familiar"
        />
      );
    }

    return (
      <EmptyState
        image={require("../../../assets/images/illustrations/empty_appointments_clock_checkmark.png")}
        title="Sin turnos agendados"
        subtitle="Agenda el proximo turno medico"
        buttonText="Agregar Turno"
        onButtonPress={handleAddAppointment}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing["5xl"],
          },
          appointments.length === 0 && styles.emptyContainer,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      />
      {children.length > 0 ? (
        <FloatingActionButton
          onPress={handleAddAppointment}
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
});
