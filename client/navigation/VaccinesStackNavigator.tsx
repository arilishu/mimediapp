import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import VaccinesScreen from "@/screens/VaccinesScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type VaccinesStackParamList = {
  Vaccines: undefined;
};

const Stack = createNativeStackNavigator<VaccinesStackParamList>();

export default function VaccinesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Vaccines"
        component={VaccinesScreen}
        options={{
          headerTitle: "Calendario de Vacunas",
        }}
      />
    </Stack.Navigator>
  );
}
