import React from "react";
import { Pressable, Alert, Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useClerk } from "@clerk/clerk-expo";

import DashboardScreen from "@/screens/DashboardScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

export type DashboardStackParamList = {
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

function SignOutButton() {
  const { theme } = useTheme();
  const { signOut } = useClerk();

  const performSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      if (window.confirm("¿Estás seguro que deseas cerrar sesión?")) {
        performSignOut();
      }
    } else {
      Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro que deseas cerrar sesión?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cerrar Sesión",
            style: "destructive",
            onPress: performSignOut,
          },
        ]
      );
    }
  };

  return (
    <Pressable onPress={handleSignOut} hitSlop={8} testID="button-signout">
      <Feather name="log-out" size={22} color={theme.text} />
    </Pressable>
  );
}

export default function DashboardStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Mis Niños" />,
          headerRight: () => <SignOutButton />,
        }}
      />
    </Stack.Navigator>
  );
}
