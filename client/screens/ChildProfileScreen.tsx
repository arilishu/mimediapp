import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/ThemedText";
import { SectionHeader } from "@/components/SectionHeader";
import { VisitCard } from "@/components/VisitCard";
import { AppointmentCard } from "@/components/AppointmentCard";
import { VaccineRow } from "@/components/VaccineRow";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import {
  ChildrenAPI,
  VisitsAPI,
  DoctorsAPI,
  AppointmentsAPI,
  VaccinesAPI,
  MedicationsAPI,
  AllergiesAPI,
  DiseasesAPI,
} from "@/lib/api";
import { calculateAge, getChildTintColor, isFuture } from "@/lib/utils";
import type { Child, MedicalVisit, Doctor, Appointment, Vaccine, Medication, Allergy, PastDisease } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "ChildProfile">;

export default function ChildProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId } = useAuth();
  const { childId } = route.params;

  const [child, setChild] = useState<Child | null>(null);
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [doctors, setDoctors] = useState<Record<string, Doctor>>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [diseases, setDiseases] = useState<PastDisease[]>([]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const [
        childData,
        visitsData,
        doctorsData,
        appointmentsData,
        vaccinesData,
        medicationsData,
        allergiesData,
        diseasesData,
      ] = await Promise.all([
        ChildrenAPI.getById(childId, userId),
        VisitsAPI.getByChildId(childId),
        DoctorsAPI.getAll(userId),
        AppointmentsAPI.getByChildId(childId),
        VaccinesAPI.getByChildId(childId),
        MedicationsAPI.getByChildId(childId),
        AllergiesAPI.getByChildId(childId),
        DiseasesAPI.getByChildId(childId),
      ]);

      if (childData) {
        setChild(childData);
      }
      setVisits(visitsData);
      setDoctors(
        doctorsData.reduce((acc, doc) => ({ ...acc, [doc.id]: doc }), {})
      );
      setAppointments(appointmentsData.filter((a) => isFuture(a.date)));
      setVaccines(vaccinesData);
      setMedications(medicationsData);
      setAllergies(allergiesData);
      setDiseases(diseasesData);
    } catch (error) {
      console.error("Error loading child data:", error);
    }
  }, [childId, userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (!child) {
    return null;
  }

  const tintColor = getChildTintColor(child.avatarIndex, theme);
  const nextAppointment = appointments[0];
  const recentVisits = visits.slice(0, 3);
  const recentVaccines = vaccines.slice(0, 3);
  const recentMedications = medications.slice(0, 3);
  const recentAllergies = allergies.slice(0, 3);
  const recentDiseases = diseases.slice(0, 3);

  const handleAddVisit = () => {
    navigation.navigate("AddVisit", { childId });
  };

  const handleToggleVaccine = async (vaccine: Vaccine) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = {
      isApplied: !vaccine.isApplied,
      appliedDate: !vaccine.isApplied ? new Date().toISOString() : undefined,
    };
    await VaccinesAPI.update(vaccine.id, updated);
    loadData();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing["2xl"],
        },
      ]}
    >
      <View style={[styles.header, { backgroundColor: tintColor }]}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.backgroundDefault }]}>
          <Feather
            name={child.sex === "male" ? "user" : "user"}
            size={40}
            color={theme.primary}
          />
        </View>
        <ThemedText type="h2" style={styles.name}>
          {child.name}
        </ThemedText>
        <ThemedText type="body" style={[styles.age, { color: theme.textSecondary }]}>
          {calculateAge(child.birthDate)}
        </ThemedText>
        {child.isShared ? (
          <View style={[styles.sharedBadge, { backgroundColor: theme.info + "30" }]}>
            <Feather name="users" size={14} color={theme.info} />
            <ThemedText type="small" style={{ color: theme.info }}>
              {child.isReadOnly ? "Compartido (solo lectura)" : "Compartido"}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {nextAppointment ? (
        <View style={styles.section}>
          <SectionHeader title="Proximo Turno" showSeeMore={false} />
          <AppointmentCard
            appointment={nextAppointment}
            doctor={nextAppointment.doctorId ? doctors[nextAppointment.doctorId] : undefined}
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title="Ultimas Visitas"
          onSeeMore={() => navigation.navigate("VisitsList", { childId })}
          showSeeMore={visits.length > 3}
        />
        {recentVisits.length > 0 ? (
          recentVisits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              doctor={doctors[visit.doctorId]}
            />
          ))
        ) : (
          <Pressable
            onPress={handleAddVisit}
            style={[styles.addCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <Feather name="plus" size={20} color={theme.primary} />
            <ThemedText type="body" style={{ color: theme.primary }}>
              Agregar primera visita
            </ThemedText>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Vacunas"
          onSeeMore={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            (navigation as any).navigate("Main", {
              screen: "VaccinesTab", 
              params: { 
                screen: "Vaccines", 
                params: { childId } 
              }
            });
          }}
          showSeeMore={vaccines.length > 3}
        />
        {recentVaccines.length > 0 ? (
          recentVaccines.map((vaccine) => (
            <VaccineRow
              key={vaccine.id}
              vaccine={vaccine}
              onToggle={() => handleToggleVaccine(vaccine)}
            />
          ))
        ) : (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            No hay vacunas registradas
          </ThemedText>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Medicamentos"
          onSeeMore={() => navigation.navigate("MedicationsList", { childId })}
          showSeeMore={medications.length > 0}
        />
        {recentMedications.length > 0 ? (
          <View style={styles.chips}>
            {recentMedications.map((med) => (
              <Pressable
                key={med.id}
                onPress={() => navigation.navigate("MedicationsList", { childId })}
                style={[styles.chip, { backgroundColor: theme.secondary + "30" }]}
              >
                <ThemedText type="small" style={{ fontWeight: "500" }}>
                  {med.name} - {med.dose}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          <Pressable
            onPress={() => navigation.navigate("AddMedication", { childId })}
            style={[styles.addCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <Feather name="plus" size={20} color={theme.primary} />
            <ThemedText type="body" style={{ color: theme.primary }}>
              Agregar medicamento
            </ThemedText>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Alergias"
          onSeeMore={() => navigation.navigate("AllergiesList", { childId })}
          showSeeMore={allergies.length > 0}
        />
        {recentAllergies.length > 0 ? (
          <View style={styles.chips}>
            {recentAllergies.map((allergy) => (
              <Pressable
                key={allergy.id}
                onPress={() => navigation.navigate("AllergiesList", { childId })}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      allergy.severity === "severe"
                        ? theme.error + "30"
                        : allergy.severity === "moderate"
                        ? theme.accent + "30"
                        : theme.warning + "20",
                  },
                ]}
              >
                <ThemedText type="small" style={{ fontWeight: "500" }}>
                  {allergy.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          <Pressable
            onPress={() => navigation.navigate("AddAllergy", { childId })}
            style={[styles.addCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <Feather name="plus" size={20} color={theme.primary} />
            <ThemedText type="body" style={{ color: theme.primary }}>
              Agregar alergia
            </ThemedText>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Enfermedades Previas"
          onSeeMore={() => {}}
          showSeeMore={diseases.length > 3}
        />
        {recentDiseases.length > 0 ? (
          recentDiseases.map((disease) => (
            <View
              key={disease.id}
              style={[styles.diseaseRow, { backgroundColor: theme.backgroundDefault }]}
            >
              <ThemedText type="body" style={{ fontWeight: "500" }}>
                {disease.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {disease.date}
              </ThemedText>
            </View>
          ))
        ) : (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            No hay enfermedades registradas
          </ThemedText>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  age: {},
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  section: {
    marginBottom: Spacing.md,
  },
  addCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#6BA5CF50",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  diseaseRow: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
});
