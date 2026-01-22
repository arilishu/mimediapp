import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { DoctorsAPI } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "AddDoctor">;

export default function AddDoctorScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId } = useAuth();
  const { doctorId } = route.params || {};

  const isEditing = !!doctorId;

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditing);

  useEffect(() => {
    if (isEditing && doctorId && userId) {
      loadDoctor();
    }
  }, [doctorId, userId]);

  const loadDoctor = async () => {
    if (!userId) return;
    try {
      const doctors = await DoctorsAPI.getAll(userId);
      const doctor = doctors.find((d) => d.id === doctorId);
      if (doctor) {
        setName(doctor.name);
        setSpecialty(doctor.specialty);
        setPhone(doctor.phone || "");
      }
    } catch (error) {
      console.error("Error loading doctor:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? "Editar Médico" : "Agregar Médico",
    });
  }, [navigation, isEditing]);

  const handleSave = async () => {
    if (!name.trim() || !specialty.trim() || !userId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && doctorId) {
        await DoctorsAPI.update(doctorId, {
          name: name.trim(),
          specialty: specialty.trim(),
          phone: phone.trim() || undefined,
        });
      } else {
        await DoctorsAPI.create({
          ownerId: userId,
          name: name.trim(),
          specialty: specialty.trim(),
          phone: phone.trim() || undefined,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving doctor:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.loadingContainer, { paddingTop: headerHeight }]}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Cargando...
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
      >
        <View style={[styles.iconHeader, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="user" size={32} color={theme.primary} />
        </View>

        <ThemedText type="h3" style={styles.title}>
          {isEditing ? "Editar datos del médico" : "Nuevo médico"}
        </ThemedText>

        <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          Los médicos se comparten entre todos tus familiares
        </ThemedText>

        <View style={styles.form}>
          <Input
            label="Nombre"
            placeholder="Ej: Juan Pérez"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            testID="input-doctor-name"
          />

          <Input
            label="Especialidad"
            placeholder="Ej: Pediatra, Dermatólogo"
            value={specialty}
            onChangeText={setSpecialty}
            autoCapitalize="words"
            testID="input-doctor-specialty"
          />

          <Input
            label="Teléfono (opcional)"
            placeholder="Ej: +54 11 1234-5678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            testID="input-doctor-phone"
          />
        </View>

        <Pressable
          style={[
            styles.saveButton,
            {
              backgroundColor: (!name.trim() || !specialty.trim() || isLoading) 
                ? theme.primary + "50" 
                : theme.primary,
            },
          ]}
          onPress={handleSave}
          disabled={!name.trim() || !specialty.trim() || isLoading}
          testID="button-save-doctor"
        >
          <ThemedText type="body" style={styles.saveButtonText}>
            {isLoading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Agregar Médico"}
          </ThemedText>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconHeader: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  saveButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
