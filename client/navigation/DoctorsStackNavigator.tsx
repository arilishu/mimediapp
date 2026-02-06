import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DoctorsListScreen from "@/screens/DoctorsListScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type DoctorsStackParamList = {
  Doctors: undefined;
};

const Stack = createNativeStackNavigator<DoctorsStackParamList>();

export default function DoctorsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Doctors"
        component={DoctorsListScreen}
        options={{
          headerTitle: "Médicos",
        }}
      />
    </Stack.Navigator>
  );
}
