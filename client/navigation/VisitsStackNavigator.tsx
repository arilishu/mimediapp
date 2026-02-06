import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import VisitsScreen from "@/screens/VisitsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type VisitsStackParamList = {
  Visits: undefined;
};

const Stack = createNativeStackNavigator<VisitsStackParamList>();

export default function VisitsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Visits"
        component={VisitsScreen}
        options={{
          headerTitle: "Visitas Medicas",
        }}
      />
    </Stack.Navigator>
  );
}
