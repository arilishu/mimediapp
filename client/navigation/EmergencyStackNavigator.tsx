import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import EmergencyScreen from "@/screens/EmergencyScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type EmergencyStackParamList = {
  Emergency: undefined;
};

const Stack = createNativeStackNavigator<EmergencyStackParamList>();

export default function EmergencyStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{
          headerTitle: "Centros médicos",
        }}
      />
    </Stack.Navigator>
  );
}
