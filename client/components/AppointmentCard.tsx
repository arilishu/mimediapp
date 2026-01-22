import React from "react";
import { View, StyleSheet, Pressable, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Appointment, Doctor, Child } from "@/types";
import { formatDate, isToday, isFuture } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: Appointment;
  doctor?: Doctor;
  child?: Child;
  onPress?: () => void;
  onDelete?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AppointmentCard({
  appointment,
  doctor,
  child,
  onPress,
  onDelete,
}: AppointmentCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const isUpcoming = isFuture(appointment.date);
  const isTodayAppointment = isToday(appointment.date);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const statusColor = isTodayAppointment
    ? theme.accent
    : isUpcoming
    ? theme.primary
    : theme.textSecondary;

  const handleAddToGoogleCalendar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(":").map(Number);
    appointmentDate.setHours(hours || 9, minutes || 0, 0, 0);
    
    const endDate = new Date(appointmentDate);
    endDate.setHours(endDate.getHours() + 1);
    
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };
    
    const title = encodeURIComponent(
      doctor ? `Turno con: ${doctor.name}` : "Turno médico"
    );
    const dates = `${formatGoogleDate(appointmentDate)}/${formatGoogleDate(endDate)}`;
    const details = encodeURIComponent(
      [
        doctor?.specialty ? `Especialidad: ${doctor.specialty}` : "",
        child ? `Familiar: ${child.name}` : "",
        appointment.notes ? `Notas: ${appointment.notes}` : "",
      ].filter(Boolean).join("\n")
    );
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
    
    Linking.openURL(url);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault },
        Shadows.card,
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View
          style={[styles.statusIndicator, { backgroundColor: statusColor }]}
        />
        <View style={styles.details}>
          <View style={styles.dateRow}>
            <ThemedText type="body" style={styles.date}>
              {formatDate(appointment.date)}
            </ThemedText>
            {isTodayAppointment ? (
              <View style={[styles.todayBadge, { backgroundColor: theme.accent + "20" }]}>
                <ThemedText
                  type="caption"
                  style={[styles.todayText, { color: theme.accent }]}
                >
                  Hoy
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText
            type="small"
            style={[styles.time, { color: theme.textSecondary }]}
          >
            {appointment.time}
          </ThemedText>
          {doctor ? (
            <ThemedText type="body" style={styles.doctorName}>
              Dr. {doctor.name}
            </ThemedText>
          ) : null}
          {doctor?.specialty ? (
            <ThemedText
              type="small"
              style={[styles.specialty, { color: theme.textSecondary }]}
            >
              {doctor.specialty}
            </ThemedText>
          ) : null}
          {child ? (
            <View style={[styles.childBadge, { backgroundColor: theme.childTint1 }]}>
              <Feather name="user" size={12} color={theme.primary} />
              <ThemedText
                type="caption"
                style={[styles.childName, { color: theme.primary }]}
              >
                {child.name}
              </ThemedText>
            </View>
          ) : null}
          {appointment.notes ? (
            <ThemedText
              type="small"
              style={[styles.notes, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {appointment.notes}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={handleAddToGoogleCalendar}
            style={({ pressed }) => [
              styles.calendarButton,
              { backgroundColor: theme.primary + "15", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="calendar" size={16} color={theme.primary} />
          </Pressable>
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="trash-2" size={18} color={theme.error} />
            </Pressable>
          ) : null}
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
  },
  statusIndicator: {
    width: 4,
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  details: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  date: {
    fontWeight: "600",
  },
  todayBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  todayText: {
    fontWeight: "700",
  },
  time: {
    marginTop: 2,
  },
  doctorName: {
    marginTop: Spacing.sm,
    fontWeight: "500",
  },
  specialty: {},
  childBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  childName: {
    fontWeight: "600",
  },
  notes: {
    marginTop: Spacing.sm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  calendarButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
});
