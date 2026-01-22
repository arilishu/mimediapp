import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { ChildrenAPI } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type EditChildRouteProp = RouteProp<RootStackParamList, "EditChild">;

export default function EditChildScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditChildRouteProp>();
  const { userId } = useAuth();
  const { childId } = route.params;

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [sex, setSex] = useState<"male" | "female">("male");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    loadChild();
  }, [childId]);

  const loadChild = async () => {
    if (!userId) return;
    
    try {
      const child = await ChildrenAPI.getById(childId, userId);
      setName(child.name);
      setBirthDate(new Date(child.birthDate));
      setSex(child.sex);
    } catch (error) {
      console.error("Error loading child:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      await ChildrenAPI.update(childId, {
        name: name.trim(),
        birthDate: birthDate.toISOString(),
        sex,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating child:", error);
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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
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
        Editar Datos
      </ThemedText>
      <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
        Modifica los datos del familiar
      </ThemedText>

      <Input
        label="Nombre"
        placeholder="Nombre del familiar"
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
              Masculino
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
              Femenino
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <Button
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={styles.submitButton}
      >
        {isSubmitting ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
