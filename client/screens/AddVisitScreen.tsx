import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@clerk/clerk-expo";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { VisitsAPI, DoctorsAPI } from "@/lib/api";
import type { Doctor } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "AddVisit">;

export default function AddVisitScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId } = useAuth();
  const { childId } = route.params;

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [headCircumference, setHeadCircumference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showNewDoctor, setShowNewDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState("");

  useEffect(() => {
    loadDoctors();
  }, [userId]);

  const loadDoctors = async () => {
    if (!userId) return;
    try {
      const doctorsData = await DoctorsAPI.getAll(userId);
      setDoctors(doctorsData);
    } catch (error) {
      console.error("Error loading doctors:", error);
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;
    
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let doctorId = selectedDoctorId;

      if (showNewDoctor && newDoctorName.trim()) {
        const newDoctor = await DoctorsAPI.create({
          name: newDoctorName.trim(),
          specialty: newDoctorSpecialty.trim() || "Pediatria",
          ownerId: userId,
        });
        doctorId = newDoctor.id;
      }

      if (!doctorId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsSubmitting(false);
        return;
      }

      await VisitsAPI.create({
        childId,
        doctorId,
        date: date.toISOString(),
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        headCircumference: headCircumference ? parseFloat(headCircumference) : undefined,
        notes: notes.trim() || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating visit:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
        Nueva Visita
      </ThemedText>
      <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
        Registra los datos de la consulta medica
      </ThemedText>

      <View style={styles.field}>
        <ThemedText type="small" style={styles.label}>
          Fecha
        </ThemedText>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={[
            styles.dateButton,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <Feather name="calendar" size={20} color={theme.textSecondary} />
          <ThemedText type="body" style={styles.dateText}>
            {formatDate(date)}
          </ThemedText>
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

      <View style={styles.field}>
        <ThemedText type="small" style={styles.label}>
          Medico
        </ThemedText>
        {!showNewDoctor ? (
          <>
            <View style={styles.doctorList}>
              {doctors.map((doctor) => (
                <Pressable
                  key={doctor.id}
                  onPress={() => setSelectedDoctorId(doctor.id)}
                  style={[
                    styles.doctorChip,
                    {
                      backgroundColor:
                        selectedDoctorId === doctor.id
                          ? theme.primary
                          : theme.backgroundDefault,
                      borderColor:
                        selectedDoctorId === doctor.id ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: selectedDoctorId === doctor.id ? "#FFFFFF" : theme.text,
                      fontWeight: "500",
                    }}
                  >
                    Dr. {doctor.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setShowNewDoctor(true)}
              style={[styles.addDoctorButton, { borderColor: theme.primary }]}
            >
              <Feather name="plus" size={16} color={theme.primary} />
              <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                Nuevo Medico
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <View style={styles.newDoctorForm}>
            <Input
              placeholder="Nombre del medico"
              value={newDoctorName}
              onChangeText={setNewDoctorName}
              leftIcon="user"
            />
            <Input
              placeholder="Especialidad"
              value={newDoctorSpecialty}
              onChangeText={setNewDoctorSpecialty}
              leftIcon="briefcase"
            />
            <Pressable
              onPress={() => {
                setShowNewDoctor(false);
                setNewDoctorName("");
                setNewDoctorSpecialty("");
              }}
            >
              <ThemedText type="small" style={{ color: theme.error }}>
                Cancelar
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>
        Medidas
      </ThemedText>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input
            label="Peso (kg)"
            placeholder="0.0"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Altura (cm)"
            placeholder="0.0"
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <Input
        label="Perimetro Cefalico (cm)"
        placeholder="0.0"
        value={headCircumference}
        onChangeText={setHeadCircumference}
        keyboardType="decimal-pad"
      />

      <Input
        label="Notas / Indicaciones"
        placeholder="Observaciones de la consulta..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        style={styles.notesInput}
      />

      <Button
        onPress={handleSubmit}
        disabled={isSubmitting || (!selectedDoctorId && !newDoctorName.trim())}
        style={styles.submitButton}
      >
        {isSubmitting ? "Guardando..." : "Guardar Visita"}
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
    marginBottom: Spacing.xs,
    fontWeight: "600",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  dateText: {
    flex: 1,
  },
  doctorList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  doctorChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  addDoctorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  newDoctorForm: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: Spacing.xl,
  },
});
