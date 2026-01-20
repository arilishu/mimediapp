import React, { useState } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ChildStorage, VaccineStorage } from "@/lib/storage";
import { VACCINE_SCHEDULE } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddChildScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [sex, setSex] = useState<"male" | "female">("male");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = async () => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const child = await ChildStorage.create({
        name: name.trim(),
        birthDate: birthDate.toISOString(),
        sex,
        avatarIndex: Math.floor(Math.random() * 4),
      });

      for (const vaccine of VACCINE_SCHEDULE) {
        await VaccineStorage.create({
          childId: child.id,
          name: vaccine.name,
          recommendedAge: vaccine.recommendedAge,
          isApplied: false,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating child:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
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
        Nuevo Niño
      </ThemedText>
      <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
        Ingresa los datos basicos de tu hijo
      </ThemedText>

      <Input
        label="Nombre"
        placeholder="Nombre del niño"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (errors.name) setErrors({});
        }}
        error={errors.name}
        leftIcon="user"
      />

      <View style={styles.field}>
        <ThemedText type="small" style={styles.label}>
          Fecha de Nacimiento
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
            {formatDate(birthDate)}
          </ThemedText>
        </Pressable>
      </View>

      {showDatePicker ? (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      ) : null}

      <View style={styles.field}>
        <ThemedText type="small" style={styles.label}>
          Sexo
        </ThemedText>
        <View style={styles.sexButtons}>
          <Pressable
            onPress={() => setSex("male")}
            style={[
              styles.sexButton,
              {
                backgroundColor:
                  sex === "male" ? theme.primary : theme.backgroundDefault,
                borderColor: sex === "male" ? theme.primary : theme.border,
              },
            ]}
          >
            <Feather
              name="user"
              size={20}
              color={sex === "male" ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              type="body"
              style={{ color: sex === "male" ? "#FFFFFF" : theme.text }}
            >
              Niño
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setSex("female")}
            style={[
              styles.sexButton,
              {
                backgroundColor:
                  sex === "female" ? theme.primary : theme.backgroundDefault,
                borderColor: sex === "female" ? theme.primary : theme.border,
              },
            ]}
          >
            <Feather
              name="user"
              size={20}
              color={sex === "female" ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              type="body"
              style={{ color: sex === "female" ? "#FFFFFF" : theme.text }}
            >
              Niña
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <Button
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={styles.submitButton}
      >
        {isSubmitting ? "Guardando..." : "Guardar"}
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
  sexButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  sexButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
  },
  submitButton: {
    marginTop: Spacing.xl,
  },
});
