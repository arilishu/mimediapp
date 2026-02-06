import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
<<<<<<< HEAD

import DashboardStackNavigator from "@/navigation/DashboardStackNavigator";
import EmergencyStackNavigator from "@/navigation/EmergencyStackNavigator";
import DoctorsStackNavigator from "@/navigation/DoctorsStackNavigator";
import { useTheme } from "@/hooks/useTheme";

export type MainTabParamList = {
  DashboardTab: undefined;
  DoctorsTab: undefined;
  EmergencyTab: undefined;
=======
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";

export type MainTabParamList = {
  HomeTab: undefined;
  ProfileTab: undefined;
>>>>>>> 3a0bcec (Extracted stack files)
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
<<<<<<< HEAD
      initialRouteName="DashboardTab"
=======
      initialRouteName="HomeTab"
>>>>>>> 3a0bcec (Extracted stack files)
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
<<<<<<< HEAD
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          title: "Familiares",
=======
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Home",
>>>>>>> 3a0bcec (Extracted stack files)
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
<<<<<<< HEAD
        name="DoctorsTab"
        component={DoctorsStackNavigator}
        options={{
          title: "Médicos",
=======
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
>>>>>>> 3a0bcec (Extracted stack files)
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
<<<<<<< HEAD
      <Tab.Screen
        name="EmergencyTab"
        component={EmergencyStackNavigator}
        options={{
          title: "Centros",
          tabBarIcon: ({ color, size }) => (
            <Feather name="alert-circle" size={size} color={color} />
          ),
        }}
      />
=======
>>>>>>> 3a0bcec (Extracted stack files)
    </Tab.Navigator>
  );
}
