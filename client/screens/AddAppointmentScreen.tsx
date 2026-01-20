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

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ChildSelector } from "@/components/ChildSelector";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { AppointmentStorage, DoctorStorage, ChildStorage } from "@/lib/storage";
import type { Doctor, Child } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "AddAppointment">;

export default function AddAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { childId: initialChildId } = route.params;

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>(initialChildId);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState("09:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showNewDoctor, setShowNewDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [childrenData, doctorsData] = await Promise.all([
        ChildStorage.getAll(),
        DoctorStorage.getAll(),
      ]);
      setChildren(childrenData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let doctorId = selectedDoctorId;

      if (showNewDoctor && newDoctorName.trim()) {
        const newDoctor = await DoctorStorage.create({
          name: newDoctorName.trim(),
          specialty: newDoctorSpecialty.trim() || "Pediatria",
        });
        doctorId = newDoctor.id;
      }

      await AppointmentStorage.create({
        childId: selectedChildId,
        doctorId: doctorId || undefined,
        date: date.toISOString(),
        time,
        notes: notes.trim() || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating appointment:", error);
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

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getTimeDate = () => {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
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
        Nuevo Turno
      </ThemedText>
      <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
        Agenda una cita medica
      </ThemedText>

      {children.length > 1 ? (
        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Niño
          </ThemedText>
          <ChildSelector
            children={children}
            selectedChildId={selectedChildId}
            onSelect={setSelectedChildId}
          />
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={styles.halfField}>
          <ThemedText type="small" style={styles.label}>
            Fecha
          </ThemedText>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.pickerButton,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <Feather name="calendar" size={18} color={theme.textSecondary} />
            <ThemedText type="small" style={styles.pickerText}>
              {formatDate(date)}
            </ThemedText>
          </Pressable>
        </View>
        <View style={styles.halfField}>
          <ThemedText type="small" style={styles.label}>
            Hora
          </ThemedText>
          <Pressable
            onPress={() => setShowTimePicker(true)}
            style={[
              styles.pickerButton,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <Feather name="clock" size={18} color={theme.textSecondary} />
            <ThemedText type="small" style={styles.pickerText}>
              {time}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {showDatePicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      ) : null}

      {showTimePicker ? (
        <DateTimePicker
          value={getTimeDate()}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange}
        />
      ) : null}

      <View style={styles.field}>
        <ThemedText type="small" style={styles.label}>
          Medico (opcional)
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

      <Input
        label="Notas (opcional)"
        placeholder="Observaciones..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={styles.notesInput}
      />

      <Button
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={styles.submitButton}
      >
        {isSubmitting ? "Guardando..." : "Agendar Turno"}
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
  row: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfField: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  pickerText: {
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
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: Spacing.xl,
  },
});
