import React, { useState } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
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
import { ChildrenAPI, VaccinesAPI, ChildAccessAPI } from "@/lib/api";
import { getApiUrl } from "@/lib/query-client";
import { VACCINE_SCHEDULE } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Mode = "new" | "shared";

export default function AddChildScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();

  const [mode, setMode] = useState<Mode>("new");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [sex, setSex] = useState<"male" | "female">("male");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});

  const [shareCode, setShareCode] = useState("");
  const [isLoadingShare, setIsLoadingShare] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;
    
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
      const child = await ChildrenAPI.create({
        name: name.trim(),
        birthDate: birthDate.toISOString(),
        sex,
        avatarIndex: Math.floor(Math.random() * 4),
        ownerId: userId,
      });

      await VaccinesAPI.createBatch(child.id, VACCINE_SCHEDULE);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating child:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadSharedChild = async () => {
    if (!userId) return;
    
    if (!shareCode.trim()) {
      setErrors({ code: "Ingresa un codigo de comparticion" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoadingShare(true);
    setErrors({});

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/share-codes/${shareCode.trim()}`, apiUrl).toString()
      );

      if (!response.ok) {
        if (response.status === 404) {
          setErrors({ code: "Codigo no encontrado. Verifica e intenta nuevamente." });
        } else {
          setErrors({ code: "Error al buscar el codigo" });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoadingShare(false);
        return;
      }

      const codeData = await response.json();

      // Add access to this child for the current user
      await ChildAccessAPI.create(codeData.childId, userId, codeData.isReadOnly);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error loading shared child:", error);
      setErrors({ code: "Error al cargar el niño compartido" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoadingShare(false);
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
      <View style={styles.modeSelector}>
        <Pressable
          onPress={() => setMode("new")}
          style={[
            styles.modeButton,
            {
              backgroundColor:
                mode === "new" ? theme.primary : theme.backgroundDefault,
              borderColor: mode === "new" ? theme.primary : theme.border,
            },
          ]}
        >
          <Feather
            name="user-plus"
            size={18}
            color={mode === "new" ? "#FFFFFF" : theme.textSecondary}
          />
          <ThemedText
            type="small"
            style={{ color: mode === "new" ? "#FFFFFF" : theme.text }}
          >
            Nuevo
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setMode("shared")}
          style={[
            styles.modeButton,
            {
              backgroundColor:
                mode === "shared" ? theme.primary : theme.backgroundDefault,
              borderColor: mode === "shared" ? theme.primary : theme.border,
            },
          ]}
        >
          <Feather
            name="link"
            size={18}
            color={mode === "shared" ? "#FFFFFF" : theme.textSecondary}
          />
          <ThemedText
            type="small"
            style={{ color: mode === "shared" ? "#FFFFFF" : theme.text }}
          >
            Codigo
          </ThemedText>
        </Pressable>
      </View>

      {mode === "new" ? (
        <>
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
        </>
      ) : (
        <>
          <ThemedText type="h3" style={styles.title}>
            Cargar Niño Compartido
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Ingresa el codigo que te compartieron para agregar al niño
          </ThemedText>

          <Input
            label="Codigo de comparticion"
            placeholder="Ej: ABCD1234"
            value={shareCode}
            onChangeText={(text) => {
              setShareCode(text.toUpperCase());
              if (errors.code) setErrors({});
            }}
            error={errors.code}
            leftIcon="link"
            autoCapitalize="characters"
          />

          <View style={[styles.infoBox, { backgroundColor: theme.info + "15", borderColor: theme.info + "30" }]}>
            <Feather name="info" size={18} color={theme.info} />
            <ThemedText type="small" style={{ color: theme.info, flex: 1 }}>
              Pide a la persona que te comparta el codigo de 8 caracteres desde su aplicacion.
            </ThemedText>
          </View>

          <Button
            onPress={handleLoadSharedChild}
            disabled={isLoadingShare}
            style={styles.submitButton}
          >
            {isLoadingShare ? "Cargando..." : "Cargar Niño"}
          </Button>
        </>
      )}
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
  modeSelector: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
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
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
});
