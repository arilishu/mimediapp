import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MedicationsAPI } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "AddMedication">;

export default function AddMedicationScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { childId, medicationId } = route.params;

  const isEditing = !!medicationId;

  const [name, setName] = useState("");
  const [symptom, setSymptom] = useState("");
  const [dose, setDose] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditing);

  useEffect(() => {
    if (isEditing && medicationId) {
      loadMedication();
    }
  }, [medicationId]);

  const loadMedication = async () => {
    try {
      const medications = await MedicationsAPI.getByChildId(childId);
      const medication = medications.find((m) => m.id === medicationId);
      if (medication) {
        setName(medication.name);
        setSymptom(medication.symptom || "");
        setDose(medication.dose);
      }
    } catch (error) {
      console.error("Error loading medication:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? "Editar Medicamento" : "Agregar Medicamento",
    });
  }, [navigation, isEditing]);

  const handleSave = async () => {
    if (!name.trim() || !dose.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && medicationId) {
        await MedicationsAPI.update(medicationId, {
          name: name.trim(),
          symptom: symptom.trim() || undefined,
          dose: dose.trim(),
        });
      } else {
        await MedicationsAPI.create({
          childId,
          name: name.trim(),
          symptom: symptom.trim() || undefined,
          dose: dose.trim(),
          category: "Pediatria General",
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving medication:", error);
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
        <View style={[styles.iconHeader, { backgroundColor: theme.secondary + "20" }]}>
          <Feather name="package" size={32} color={theme.secondary} />
        </View>

        <ThemedText type="h3" style={styles.title}>
          {isEditing ? "Editar medicamento frecuente" : "Nuevo medicamento frecuente"}
        </ThemedText>

        <View style={styles.form}>
          <Input
            label="Droga / Nombre"
            placeholder="Ej: Ibuprofeno"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            testID="input-medication-name"
          />

          <Input
            label="Sintoma"
            placeholder="Ej: Fiebre, dolor de cabeza"
            value={symptom}
            onChangeText={setSymptom}
            autoCapitalize="sentences"
            testID="input-medication-symptom"
          />

          <Input
            label="Cantidad / Dosis"
            placeholder="Ej: 5ml cada 8hs"
            value={dose}
            onChangeText={setDose}
            multiline
            numberOfLines={3}
            testID="input-medication-dose"
          />
        </View>

        <Pressable
          style={[
            styles.saveButton,
            {
              backgroundColor: (!name.trim() || !dose.trim() || isLoading) 
                ? theme.primary + "50" 
                : theme.primary,
            },
          ]}
          onPress={handleSave}
          disabled={!name.trim() || !dose.trim() || isLoading}
          testID="button-save-medication"
        >
          <ThemedText type="body" style={styles.saveButtonText}>
            {isLoading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Agregar Medicamento"}
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
