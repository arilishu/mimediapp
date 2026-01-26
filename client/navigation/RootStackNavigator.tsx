import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import ChildProfileScreen from "@/screens/children/ChildProfileScreen";
import AddChildScreen from "@/screens/children/AddChildScreen";
import EditChildScreen from "@/screens/children/EditChildScreen";
import AddVisitScreen from "@/screens/visits/AddVisitScreen";
import VisitsListScreen from "@/screens/visits/VisitsListScreen";
import AddAppointmentScreen from "@/screens/appointments/AddAppointmentScreen";
import AddHospitalScreen from "@/screens/emergency/AddHospitalScreen";
import MedicationsListScreen from "@/screens/medications/MedicationsListScreen";
import AddMedicationScreen from "@/screens/medications/AddMedicationScreen";
import AllergiesListScreen from "@/screens/allergies/AllergiesListScreen";
import AddAllergyScreen from "@/screens/allergies/AddAllergyScreen";
import DiseasesListScreen from "@/screens/diseases/DiseasesListScreen";
import AddDiseaseScreen from "@/screens/diseases/AddDiseaseScreen";
import DoctorsListScreen from "@/screens/doctors/DoctorsListScreen";
import AddDoctorScreen from "@/screens/doctors/AddDoctorScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  ChildProfile: { childId: string };
  AddChild: undefined;
  EditChild: { childId: string };
  AddVisit: { childId: string; visitId?: string };
  VisitsList: { childId: string };
  AddAppointment: { childId: string; appointmentId?: string };
  AddHospital: { hospitalId?: string };
  MedicationsList: { childId: string };
  AddMedication: { childId: string; medicationId?: string };
  AllergiesList: { childId: string };
  AddAllergy: { childId: string; allergyId?: string };
  DiseasesList: { childId: string };
  AddDisease: { childId: string; diseaseId?: string };
  DoctorsList: undefined;
  AddDoctor: { doctorId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChildProfile"
        component={ChildProfileScreen}
        options={{
          headerTitle: "Perfil",
        }}
      />
      <Stack.Screen
        name="AddChild"
        component={AddChildScreen}
        options={{
          presentation: "modal",
          headerTitle: "Nuevo Familiar",
        }}
      />
      <Stack.Screen
        name="EditChild"
        component={EditChildScreen}
        options={{
          presentation: "modal",
          headerTitle: "Editar Familiar",
        }}
      />
      <Stack.Screen
        name="AddVisit"
        component={AddVisitScreen}
        options={{
          presentation: "modal",
          headerTitle: "Visita",
        }}
      />
      <Stack.Screen
        name="VisitsList"
        component={VisitsListScreen}
        options={{
          headerTitle: "Visitas Médicas",
        }}
      />
      <Stack.Screen
        name="AddAppointment"
        component={AddAppointmentScreen}
        options={{
          presentation: "modal",
          headerTitle: "Nuevo Turno",
        }}
      />
      <Stack.Screen
        name="AddHospital"
        component={AddHospitalScreen}
        options={{
          presentation: "modal",
          headerTitle: "Nuevo Centro médico",
        }}
      />
      <Stack.Screen
        name="MedicationsList"
        component={MedicationsListScreen}
        options={{
          headerTitle: "Medicamentos",
        }}
      />
      <Stack.Screen
        name="AddMedication"
        component={AddMedicationScreen}
        options={{
          presentation: "modal",
          headerTitle: "Medicamento",
        }}
      />
      <Stack.Screen
        name="AllergiesList"
        component={AllergiesListScreen}
        options={{
          headerTitle: "Alergias",
        }}
      />
      <Stack.Screen
        name="AddAllergy"
        component={AddAllergyScreen}
        options={{
          presentation: "modal",
          headerTitle: "Alergia",
        }}
      />
      <Stack.Screen
        name="DiseasesList"
        component={DiseasesListScreen}
        options={{
          headerTitle: "Enfermedades",
        }}
      />
      <Stack.Screen
        name="AddDisease"
        component={AddDiseaseScreen}
        options={{
          presentation: "modal",
          headerTitle: "Enfermedad",
        }}
      />
      <Stack.Screen
        name="DoctorsList"
        component={DoctorsListScreen}
        options={{
          headerTitle: "Médicos",
        }}
      />
      <Stack.Screen
        name="AddDoctor"
        component={AddDoctorScreen}
        options={{
          presentation: "modal",
          headerTitle: "Médico",
        }}
      />
    </Stack.Navigator>
  );
}
