import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AppointmentsScreen from "@/screens/AppointmentsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type AppointmentsStackParamList = {
  Appointments: undefined;
};

const Stack = createNativeStackNavigator<AppointmentsStackParamList>();

export default function AppointmentsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          headerTitle: "Proximos Turnos",
        }}
      />
    </Stack.Navigator>
  );
}
