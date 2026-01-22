import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import DashboardStackNavigator from "@/navigation/DashboardStackNavigator";
import EmergencyStackNavigator from "@/navigation/EmergencyStackNavigator";
import DoctorsStackNavigator from "@/navigation/DoctorsStackNavigator";
import { useTheme } from "@/hooks/useTheme";

export type MainTabParamList = {
  DashboardTab: undefined;
  DoctorsTab: undefined;
  EmergencyTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          title: "Familiares",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DoctorsTab"
        component={DoctorsStackNavigator}
        options={{
          title: "Médicos",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EmergencyTab"
        component={EmergencyStackNavigator}
        options={{
          title: "Emergencias",
          tabBarIcon: ({ color, size }) => (
            <Feather name="alert-circle" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
