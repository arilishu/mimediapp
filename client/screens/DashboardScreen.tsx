import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, Text, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const rootNavigation = useNavigation<any>();
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

  const performDeleteChild = async (child: Child) => {
    try {
      await ChildrenAPI.delete(child.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } catch (error) {
      console.error("Error deleting child:", error);
      if (Platform.OS === "web") {
        window.alert("No se pudo eliminar al hijo. Intenta de nuevo.");
      } else {
        Alert.alert("Error", "No se pudo eliminar al hijo. Intenta de nuevo.");
      }
    }
  };

  const handleDeleteChild = (child: Child) => {
    const message = `¿Estás seguro de eliminar a ${child.name}? Se eliminarán todos sus datos médicos.`;
    
    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        performDeleteChild(child);
      }
    } else {
      Alert.alert(
        "Eliminar Hijo",
        message,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => performDeleteChild(child),
          },
        ]
      );
    }
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
                onEdit={() => navigation.navigate("EditChild", { childId: child.id })}
                onDelete={() => handleDeleteChild(child)}
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
            <Card 
              key={appointment.id}
              style={styles.appointmentCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("ChildProfile", { childId: appointment.childId });
              }}
            >
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
          ))
        )}
      </View>
    );
  };

  const renderDoctorsSection = () => {
    return (
      <Pressable
        style={[styles.doctorsCard, { backgroundColor: theme.backgroundDefault }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate("DoctorsList");
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="users" size={20} color={theme.primary} />
        </View>
        <View style={styles.doctorsInfo}>
          <Text style={[styles.doctorsTitle, { color: theme.text, fontFamily: "Nunito_700Bold" }]}>
            Mis Médicos
          </Text>
          <Text style={[styles.doctorsSubtitle, { color: theme.textSecondary, fontFamily: "Nunito_400Regular" }]}>
            Gestionar médicos para visitas y turnos
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textDisabled} />
      </Pressable>
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
            <Card 
              key={vaccine.id} 
              style={styles.vaccineCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                rootNavigation.navigate("VaccinesTab", { 
                  screen: "Vaccines", 
                  params: { childId: vaccine.childId } 
                });
              }}
            >
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
        {renderDoctorsSection()}
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
    gap: Spacing.md,
  },
  childCardWrapper: {
    width: "47%",
    flexGrow: 1,
    maxWidth: "48.5%",
  },
  cardLeft: {},
  cardRight: {},
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
  doctorsCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.xl,
  },
  doctorsInfo: {
    flex: 1,
  },
  doctorsTitle: {
    fontSize: Typography.body.fontSize,
  },
  doctorsSubtitle: {
    fontSize: Typography.small.fontSize,
    marginTop: 2,
  },
});
