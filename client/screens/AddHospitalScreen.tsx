import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { HospitalStorage } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; address?: string; phone?: string }>({});

  const toggleSpecialty = (specialty: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== specialty));
    } else {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  const handleSubmit = async () => {
    const newErrors: { name?: string; address?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    if (!address.trim()) {
      newErrors.address = "La direccion es requerida";
    }
    if (!phone.trim()) {
      newErrors.phone = "El telefono es requerido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await HospitalStorage.create({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        specialties: selectedSpecialties,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating hospital:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        Nuevo Hospital
      </ThemedText>
      <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
        Agrega un hospital o clinica de emergencia
      </ThemedText>

      <Input
        label="Nombre"
        placeholder="Hospital de Niños"
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
        {isSubmitting ? "Guardando..." : "Guardar Hospital"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
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
