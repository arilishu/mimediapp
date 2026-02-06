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
import { AllergiesAPI } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "AddAllergy">;

export default function AddAllergyScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { childId, allergyId } = route.params;

  const isEditing = !!allergyId;

  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditing);

  useEffect(() => {
    if (isEditing && allergyId) {
      loadAllergy();
    }
  }, [allergyId]);

  const loadAllergy = async () => {
    try {
      const allergies = await AllergiesAPI.getByChildId(childId);
      const allergy = allergies.find((a) => a.id === allergyId);
      if (allergy) {
        setName(allergy.name);
      }
    } catch (error) {
      console.error("Error loading allergy:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? "Editar Alergia" : "Agregar Alergia",
    });
  }, [navigation, isEditing]);

  const handleSave = async () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && allergyId) {
        await AllergiesAPI.update(allergyId, {
          name: name.trim(),
        });
      } else {
        await AllergiesAPI.create({
          childId,
          name: name.trim(),
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving allergy:", error);
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
        <View style={[styles.iconHeader, { backgroundColor: theme.warning + "20" }]}>
          <Feather name="alert-circle" size={32} color={theme.warning} />
        </View>

        <ThemedText type="h3" style={styles.title}>
          {isEditing ? "Editar alergia" : "Nueva alergia"}
        </ThemedText>

        <View style={styles.form}>
          <Input
            label="Nombre de la alergia"
            placeholder="Ej: Penicilina, Maní, Polen"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            testID="input-allergy-name"
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
          testID="button-save-allergy"
        >
          <ThemedText type="body" style={styles.saveButtonText}>
            {isLoading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Agregar Alergia"}
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
