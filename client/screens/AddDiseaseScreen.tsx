import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { DiseasesAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "AddDisease">;

export default function AddDiseaseScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { childId, diseaseId } = route.params;

  const isEditing = !!diseaseId;

  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date());
  const [medication, setMedication] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditing);

  useEffect(() => {
    if (isEditing && diseaseId) {
      loadDisease();
    }
  }, [diseaseId]);

  const loadDisease = async () => {
    try {
      const diseases = await DiseasesAPI.getByChildId(childId);
      const disease = diseases.find((d) => d.id === diseaseId);
      if (disease) {
        setName(disease.name);
        setDate(new Date(disease.date));
        setMedication(disease.notes || "");
      }
    } catch (error) {
      console.error("Error loading disease:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? "Editar Enfermedad" : "Agregar Enfermedad",
    });
  }, [navigation, isEditing]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && diseaseId) {
        await DiseasesAPI.update(diseaseId, {
          name: name.trim(),
          date: date.toISOString(),
          notes: medication.trim() || undefined,
        });
      } else {
        await DiseasesAPI.create({
          childId,
          name: name.trim(),
          date: date.toISOString(),
          notes: medication.trim() || undefined,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving disease:", error);
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
        <View style={[styles.iconHeader, { backgroundColor: theme.info + "20" }]}>
          <Feather name="thermometer" size={32} color={theme.info} />
        </View>

        <ThemedText type="h3" style={styles.title}>
          {isEditing ? "Editar enfermedad previa" : "Nueva enfermedad previa"}
        </ThemedText>

        <View style={styles.form}>
          <Input
            label="Nombre de la enfermedad"
            placeholder="Ej: Varicela, Otitis, Bronquitis"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            testID="input-disease-name"
          />

          <View>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Fecha en que la tuvo
            </ThemedText>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[styles.dateButton, { backgroundColor: theme.backgroundDefault }]}
            >
              <Feather name="calendar" size={20} color={theme.primary} />
              <ThemedText type="body">{formatDate(date.toISOString())}</ThemedText>
            </Pressable>
          </View>

          {showDatePicker ? (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          ) : null}

          <Input
            label="Medicamento que tomó (opcional)"
            placeholder="Ej: Amoxicilina 5ml cada 8hs"
            value={medication}
            onChangeText={setMedication}
            testID="input-disease-medication"
          />
        </View>

        <Pressable
          style={[
            styles.saveButton,
            {
              backgroundColor: (!name.trim() || isLoading) 
                ? theme.primary + "50" 
                : theme.primary,
            },
          ]}
          onPress={handleSave}
          disabled={!name.trim() || isLoading}
          testID="button-save-disease"
        >
          <ThemedText type="body" style={styles.saveButtonText}>
            {isLoading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Agregar Enfermedad"}
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
  label: {
    marginBottom: Spacing.sm,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
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
