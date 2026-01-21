import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import ChildProfileScreen from "@/screens/ChildProfileScreen";
import AddChildScreen from "@/screens/AddChildScreen";
import EditChildScreen from "@/screens/EditChildScreen";
import AddVisitScreen from "@/screens/AddVisitScreen";
import AddAppointmentScreen from "@/screens/AddAppointmentScreen";
import AddHospitalScreen from "@/screens/AddHospitalScreen";
import MedicationsListScreen from "@/screens/MedicationsListScreen";
import AddMedicationScreen from "@/screens/AddMedicationScreen";
import AllergiesListScreen from "@/screens/AllergiesListScreen";
import AddAllergyScreen from "@/screens/AddAllergyScreen";
import DiseasesListScreen from "@/screens/DiseasesListScreen";
import AddDiseaseScreen from "@/screens/AddDiseaseScreen";
import VisitsListScreen from "@/screens/VisitsListScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  ChildProfile: { childId: string };
  AddChild: undefined;
  EditChild: { childId: string };
  AddVisit: { childId: string; visitId?: string };
  VisitsList: { childId: string };
  AddAppointment: { childId: string };
  AddHospital: undefined;
  MedicationsList: { childId: string };
  AddMedication: { childId: string; medicationId?: string };
  AllergiesList: { childId: string };
  AddAllergy: { childId: string; allergyId?: string };
  DiseasesList: { childId: string };
  AddDisease: { childId: string; diseaseId?: string };
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
          headerTitle: "Nuevo Niño",
        }}
      />
      <Stack.Screen
        name="EditChild"
        component={EditChildScreen}
        options={{
          presentation: "modal",
          headerTitle: "Editar Niño",
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
          headerTitle: "Nuevo Hospital",
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
    </Stack.Navigator>
  );
}
