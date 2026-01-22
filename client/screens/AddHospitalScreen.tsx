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

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { HospitalsAPI } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "AddHospital">;

const SPECIALTIES = [
  "Pediatria",
  "Urgencias",
  "Traumatologia",
  "Cardiologia",
  "Neurologia",
  "Cirugia",
  "Neonatologia",
];

export default function AddHospitalScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId } = useAuth();
  const { hospitalId } = route.params || {};

  const isEditing = !!hospitalId;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditing);
  const [errors, setErrors] = useState<{ name?: string; address?: string; phone?: string }>({});

  useEffect(() => {
    if (isEditing && hospitalId && userId) {
      loadHospital();
    }
  }, [hospitalId, userId]);

  const loadHospital = async () => {
    if (!userId) return;
    try {
      const hospitals = await HospitalsAPI.getAll(userId);
      const hospital = hospitals.find((h) => h.id === hospitalId);
      if (hospital) {
        setName(hospital.name);
        setAddress(hospital.address);
        setPhone(hospital.phone || "");
        setSelectedSpecialties(hospital.specialties || []);
      }
    } catch (error) {
      console.error("Error loading hospital:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? "Editar Centro" : "Nuevo Centro",
    });
  }, [navigation, isEditing]);

  const toggleSpecialty = (specialty: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== specialty));
    } else {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;
    
    const newErrors: { name?: string; address?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    if (!address.trim()) {
      newErrors.address = "La direccion es requerida";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isEditing && hospitalId) {
        await HospitalsAPI.update(hospitalId, {
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim() || "",
          specialties: selectedSpecialties,
        });
      } else {
        await HospitalsAPI.create({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim() || "",
          specialties: selectedSpecialties,
          ownerId: userId,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving hospital:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Cargando...
        </ThemedText>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing["2xl"],
        },
      ]}
    >
      <ThemedText type="h3" style={styles.title}>
        {isEditing ? "Editar Centro médico" : "Nuevo Centro médico"}
      </ThemedText>
      <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isEditing ? "Modifica los datos del centro de salud" : "Agrega un hospital, clínica o centro de salud"}
      </ThemedText>

      <Input
        label="Nombre"
        placeholder="Ej: Centro Médico San José"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (errors.name) setErrors({ ...errors, name: undefined });
        }}
        error={errors.name}
        leftIcon="plus-circle"
      />

      <Input
        label="Direccion"
        placeholder="Av. Principal 123"
        value={address}
        onChangeText={(text) => {
          setAddress(text);
          if (errors.address) setErrors({ ...errors, address: undefined });
        }}
        error={errors.address}
        leftIcon="map-pin"
      />

      <Input
        label="Telefono"
        placeholder="+54 11 1234-5678"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          if (errors.phone) setErrors({ ...errors, phone: undefined });
        }}
        error={errors.phone}
        leftIcon="phone"
        keyboardType="phone-pad"
      />

      <View style={styles.field}>
        <ThemedText type="small" style={styles.label}>
          Especialidades (opcional)
        </ThemedText>
        <View style={styles.specialties}>
          {SPECIALTIES.map((specialty) => {
            const isSelected = selectedSpecialties.includes(specialty);
            return (
              <Pressable
                key={specialty}
                onPress={() => toggleSpecialty(specialty)}
                style={[
                  styles.specialtyChip,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.backgroundDefault,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                {isSelected ? (
                  <Feather name="check" size={14} color="#FFFFFF" />
                ) : null}
                <ThemedText
                  type="small"
                  style={{
                    color: isSelected ? "#FFFFFF" : theme.text,
                    fontWeight: "500",
                  }}
                >
                  {specialty}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={styles.submitButton}
      >
        {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Guardar Centro"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing["2xl"],
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  specialties: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  specialtyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  submitButton: {
    marginTop: Spacing.xl,
  },
});
