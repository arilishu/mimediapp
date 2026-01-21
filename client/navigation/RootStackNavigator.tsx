import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import ChildProfileScreen from "@/screens/ChildProfileScreen";
import AddChildScreen from "@/screens/AddChildScreen";
import EditChildScreen from "@/screens/EditChildScreen";
import AddVisitScreen from "@/screens/AddVisitScreen";
import AddAppointmentScreen from "@/screens/AddAppointmentScreen";
import AddHospitalScreen from "@/screens/AddHospitalScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  ChildProfile: { childId: string };
  AddChild: undefined;
  EditChild: { childId: string };
  AddVisit: { childId: string };
  VisitsList: { childId: string };
  AddAppointment: { childId: string };
  AddHospital: undefined;
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
          headerTitle: "Nueva Visita",
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
    </Stack.Navigator>
  );
}
