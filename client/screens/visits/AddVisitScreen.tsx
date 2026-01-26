import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Platform, ScrollView, Linking, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { useAudioRecorder, AudioModule, RecordingPresets } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { VisitsAPI, DoctorsAPI, VisitPhotosAPI, TranscriptionAPI } from "@/lib/api";
import type { Doctor, VisitPhoto } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "AddVisit">;

interface LocalPhoto {
  id?: string;
  uri: string;
  base64?: string;
  isNew: boolean;
}

export default function AddVisitScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId } = useAuth();
  const { childId, visitId } = route.params;

  const isEditing = !!visitId;

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [headCircumference, setHeadCircumference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditing);

  const [showNewDoctor, setShowNewDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState("");
  const [doctorsLoaded, setDoctorsLoaded] = useState(false);

  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    checkAudioPermission();
  }, []);

  const checkAudioPermission = async () => {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    setAudioPermissionGranted(status.granted);
  };

  const startRecording = async () => {
    if (!audioPermissionGranted) {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        return;
      }
      setAudioPermissionGranted(true);
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      audioRecorder.record();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      await audioRecorder.stop();
      setIsRecording(false);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const recordingUri = audioRecorder.uri;
      
      if (recordingUri) {
        setIsTranscribing(true);
        try {
          const tempPath = `${FileSystem.cacheDirectory}voice_note_${Date.now()}.m4a`;
          await FileSystem.copyAsync({
            from: recordingUri,
            to: tempPath,
          });
          
          const base64Audio = await FileSystem.readAsStringAsync(tempPath, {
            encoding: "base64",
          });
          const result = await TranscriptionAPI.transcribe(base64Audio);
          if (result.transcript) {
            setNotes((prev) => (prev ? prev + "\n" + result.transcript : result.transcript));
          }
          await FileSystem.deleteAsync(tempPath, { idempotent: true });
        } catch (error) {
          console.error("Error transcribing audio:", error);
        } finally {
          setIsTranscribing(false);
        }
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [userId]);

  useEffect(() => {
    if (doctorsLoaded && doctors.length === 0) {
      setShowNewDoctor(true);
    }
  }, [doctors, doctorsLoaded]);

  useEffect(() => {
    if (isEditing && visitId) {
      loadVisit();
      loadPhotos();
    }
  }, [visitId]);

  const loadVisit = async () => {
    try {
      const visits = await VisitsAPI.getByChildId(childId);
      const visit = visits.find((v) => v.id === visitId);
      if (visit) {
        setDate(new Date(visit.date));
        setSelectedDoctorId(visit.doctorId || null);
        setWeight(visit.weight?.toString() || "");
        setHeight(visit.height?.toString() || "");
        setHeadCircumference(visit.headCircumference?.toString() || "");
        setNotes(visit.notes || "");
      }
    } catch (error) {
      console.error("Error loading visit:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadPhotos = async () => {
    if (!visitId) return;
    try {
      const existingPhotos = await VisitPhotosAPI.getByVisitId(visitId);
      setPhotos(existingPhotos.map((p) => ({
        id: p.id,
        uri: p.photoData,
        isNew: false,
      })));
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  };

  const loadDoctors = async () => {
    if (!userId) return;
    try {
      const doctorsData = await DoctorsAPI.getAll(userId);
      setDoctors(doctorsData);
    } catch (error) {
      console.error("Error loading doctors:", error);
    } finally {
      setDoctorsLoaded(true);
    }
  };

  const pickFromGallery = async () => {
    if (!mediaPermission?.granted) {
      if (mediaPermission?.status === "denied" && !mediaPermission.canAskAgain) {
        if (Platform.OS !== "web") {
          try {
            await Linking.openSettings();
          } catch {}
        }
        return;
      }
      const result = await requestMediaPermission();
      if (!result.granted) return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.3,
      base64: true,
      exif: false,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset: ImagePicker.ImagePickerAsset) => ({
        uri: asset.uri,
        base64: asset.base64 || undefined,
        isNew: true,
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePhoto = async () => {
    if (!cameraPermission?.granted) {
      if (cameraPermission?.status === "denied" && !cameraPermission.canAskAgain) {
        if (Platform.OS !== "web") {
          try {
            await Linking.openSettings();
          } catch {}
        }
        return;
      }
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.3,
      base64: true,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, {
        uri: result.assets[0].uri,
        base64: result.assets[0].base64 || undefined,
        isNew: true,
      }]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const removePhoto = async (index: number) => {
    const photo = photos[index];
    if (!photo.isNew && photo.id) {
      try {
        await VisitPhotosAPI.delete(photo.id);
      } catch (error) {
        console.error("Error deleting photo:", error);
      }
    }
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

      let currentVisitId = visitId;

      if (isEditing && visitId) {
        await VisitsAPI.update(visitId, {
          doctorId,
          date: date.toISOString(),
          weight: weight ? parseFloat(weight) : undefined,
          height: height ? parseFloat(height) : undefined,
          headCircumference: headCircumference ? parseFloat(headCircumference) : undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        const newVisit = await VisitsAPI.create({
          childId,
          doctorId,
          date: date.toISOString(),
          weight: weight ? parseFloat(weight) : undefined,
          height: height ? parseFloat(height) : undefined,
          headCircumference: headCircumference ? parseFloat(headCircumference) : undefined,
          notes: notes.trim() || undefined,
        });
        currentVisitId = newVisit.id;
      }

      const newPhotos = photos.filter((p) => p.isNew && p.base64);
      for (const photo of newPhotos) {
        if (currentVisitId && photo.base64) {
          await VisitPhotosAPI.create(currentVisitId, `data:image/jpeg;base64,${photo.base64}`);
        }
      }

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
        {isEditing ? "Editar Visita" : "Nueva Visita"}
      </ThemedText>
      <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isEditing ? "Modifica los datos de la consulta" : "Registra los datos de la consulta medica"}
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

      <View style={styles.notesHeader}>
        <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>
          Notas / Indicaciones
        </ThemedText>
        <Pressable
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          style={[
            styles.voiceButton,
            {
              backgroundColor: isRecording ? theme.error : theme.primary,
              opacity: isTranscribing ? 0.5 : 1,
            },
          ]}
        >
          {isTranscribing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather
              name={isRecording ? "stop-circle" : "mic"}
              size={16}
              color="#FFFFFF"
            />
          )}
          <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600", marginLeft: 4 }}>
            {isTranscribing ? "Transcribiendo..." : isRecording ? "Detener" : "Voz"}
          </ThemedText>
        </Pressable>
      </View>
      <Input
        placeholder="Observaciones de la consulta..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        style={styles.notesInput}
      />

      <ThemedText type="h4" style={styles.sectionTitle}>
        Fotos
      </ThemedText>

      <View style={styles.photoButtons}>
        <Pressable
          onPress={takePhoto}
          style={[styles.photoButton, { backgroundColor: theme.primary }]}
        >
          <Feather name="camera" size={20} color="#FFFFFF" />
          <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            Camara
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={pickFromGallery}
          style={[styles.photoButton, { backgroundColor: theme.secondary }]}
        >
          <Feather name="image" size={20} color="#FFFFFF" />
          <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            Galeria
          </ThemedText>
        </Pressable>
      </View>

      {photos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
          contentContainerStyle={styles.photosContainer}
        >
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.photoThumbnail}
                contentFit="cover"
              />
              <Pressable
                onPress={() => removePhoto(index)}
                style={[styles.removePhotoButton, { backgroundColor: theme.error }]}
              >
                <Feather name="x" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <Button
        onPress={handleSubmit}
        disabled={isSubmitting || (!selectedDoctorId && !newDoctorName.trim())}
        style={styles.submitButton}
      >
        {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Guardar Visita"}
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
  notesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  photoButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  photosScroll: {
    marginBottom: Spacing.md,
  },
  photosContainer: {
    gap: Spacing.sm,
  },
  photoWrapper: {
    position: "relative",
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
  },
  removePhotoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    marginTop: Spacing.xl,
  },
});
