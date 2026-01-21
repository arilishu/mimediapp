import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect, CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";

import { ChildCard } from "@/components/ChildCard";
import { EmptyState } from "@/components/EmptyState";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { ShareModal } from "@/components/ShareModal";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";
import { ChildrenAPI, AppointmentsAPI, VaccinesAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Child, Appointment, VaccineWithChild } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingVaccines, setPendingVaccines] = useState<VaccineWithChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const [childrenData, appointmentsData, vaccinesData] = await Promise.all([
        ChildrenAPI.getAll(userId),
        AppointmentsAPI.getUpcomingByUser(userId),
        VaccinesAPI.getPendingByUser(userId),
      ]);
      setChildren(childrenData);
      setAppointments(appointmentsData);
      setPendingVaccines(vaccinesData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
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

  const handleAddChild = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("AddChild");
  };

  const handleChildPress = (child: Child) => {
    navigation.navigate("ChildProfile", { childId: child.id });
  };

  const handleShareChild = (child: Child) => {
    setSelectedChild(child);
    setShareModalVisible(true);
  };

  const renderChildrenSection = () => {
    if (children.length === 0 && !isLoading) {
      return (
        <EmptyState
          image={require("../../assets/images/illustrations/empty_children_teddy_bear.png")}
          title="Agrega tu primer hijo"
          subtitle="Comienza a registrar la informacion medica de tus hijos"
          buttonText="Agregar Nino"
          onButtonPress={handleAddChild}
        />
      );
    }

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: "Nunito_700Bold" }]}>
          Mis Hijos
        </Text>
        <View style={styles.childrenGrid}>
          {children.map((child, index) => (
            <View 
              key={child.id} 
              style={[
                styles.childCardWrapper,
                index % 2 === 0 ? styles.cardLeft : styles.cardRight
              ]}
            >
              <ChildCard
                child={child}
                onPress={() => handleChildPress(child)}
                onShare={() => handleShareChild(child)}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAppointmentsSection = () => {
    if (children.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: "Nunito_700Bold" }]}>
          Proximos Turnos
        </Text>
        {appointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyCardContent}>
              <Feather name="calendar" size={32} color={theme.textDisabled} />
              <Text style={[styles.emptyCardText, { color: theme.textSecondary, fontFamily: "Nunito_400Regular" }]}>
                No hay turnos programados
              </Text>
            </View>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Pressable 
              key={appointment.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("ChildProfile", { childId: appointment.childId });
              }}
            >
              <Card style={styles.appointmentCard}>
                <View style={styles.appointmentRow}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
                    <Feather name="calendar" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={[styles.appointmentChild, { color: theme.text, fontFamily: "Nunito_700Bold" }]}>
                      {appointment.childName}
                    </Text>
                    <Text style={[styles.appointmentDate, { color: theme.textSecondary, fontFamily: "Nunito_400Regular" }]}>
                      {formatDate(appointment.date)} - {appointment.time}
                    </Text>
                    {appointment.notes ? (
                      <Text style={[styles.appointmentNotes, { color: theme.textDisabled, fontFamily: "Nunito_400Regular" }]} numberOfLines={1}>
                        {appointment.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textDisabled} />
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    );
  };

  const renderVaccinesSection = () => {
    if (children.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: "Nunito_700Bold" }]}>
          Vacunas Pendientes
        </Text>
        {pendingVaccines.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyCardContent}>
              <Feather name="check-circle" size={32} color={theme.secondary} />
              <Text style={[styles.emptyCardText, { color: theme.textSecondary, fontFamily: "Nunito_400Regular" }]}>
                Todas las vacunas estan al dia
              </Text>
            </View>
          </Card>
        ) : (
          pendingVaccines.map((vaccine) => (
            <Pressable 
              key={vaccine.id} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("VaccinesTab", { 
                  screen: "Vaccines", 
                  params: { childId: vaccine.childId } 
                });
              }}
            >
              <Card style={styles.vaccineCard}>
                <View style={styles.vaccineRow}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.accent + "20" }]}>
                    <Feather name="shield" size={20} color={theme.accent} />
                  </View>
                  <View style={styles.vaccineInfo}>
                    <Text style={[styles.vaccineName, { color: theme.text, fontFamily: "Nunito_700Bold" }]}>
                      {vaccine.name}
                    </Text>
                    <Text style={[styles.vaccineChild, { color: theme.textSecondary, fontFamily: "Nunito_400Regular" }]}>
                      {vaccine.childName} - {vaccine.recommendedAge}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textDisabled} />
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing["5xl"],
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {renderChildrenSection()}
        {renderAppointmentsSection()}
        {renderVaccinesSection()}
      </ScrollView>
      
      {children.length > 0 ? (
        <FloatingActionButton
          onPress={handleAddChild}
          style={{
            bottom: tabBarHeight + Spacing.xl,
            right: Spacing.xl,
          }}
        />
      ) : null}
      
      {selectedChild ? (
        <ShareModal
          visible={shareModalVisible}
          onClose={() => {
            setShareModalVisible(false);
            setSelectedChild(null);
          }}
          child={selectedChild}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.h4.fontSize,
    marginBottom: Spacing.md,
  },
  childrenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  childCardWrapper: {
    width: "48%",
    marginBottom: Spacing.lg,
  },
  cardLeft: {
    marginRight: Spacing.sm,
  },
  cardRight: {
    marginLeft: Spacing.sm,
  },
  emptyCard: {
    padding: Spacing.xl,
  },
  emptyCardContent: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyCardText: {
    fontSize: Typography.small.fontSize,
    textAlign: "center",
  },
  appointmentCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentChild: {
    fontSize: Typography.body.fontSize,
  },
  appointmentDate: {
    fontSize: Typography.small.fontSize,
    marginTop: 2,
  },
  appointmentNotes: {
    fontSize: Typography.caption.fontSize,
    marginTop: 2,
  },
  vaccineCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  vaccineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  vaccineInfo: {
    flex: 1,
  },
  vaccineName: {
    fontSize: Typography.body.fontSize,
  },
  vaccineChild: {
    fontSize: Typography.small.fontSize,
    marginTop: 2,
  },
});
