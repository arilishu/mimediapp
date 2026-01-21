import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Switch,
  Share,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ShareCodeStorage } from "@/lib/storage";
import { useAuth } from "@clerk/clerk-expo";
import type { Child, ShareCode } from "@/types";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  child: Child;
}

export function ShareModal({ visible, onClose, child }: ShareModalProps) {
  const { theme } = useTheme();
  const { userId } = useAuth();
  const [shareCode, setShareCode] = useState<ShareCode | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      loadShareCode();
    }
  }, [visible]);

  const loadShareCode = async () => {
    const existingCode = await ShareCodeStorage.getByChildId(child.id);
    if (existingCode) {
      setShareCode(existingCode);
      setIsReadOnly(existingCode.isReadOnly);
    } else {
      setShareCode(null);
    }
  };

  const handleGenerateCode = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const code = await ShareCodeStorage.create({
        childId: child.id,
        ownerId: userId,
        isReadOnly,
      });
      setShareCode(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error generating share code:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReadOnly = async (value: boolean) => {
    setIsReadOnly(value);
    if (shareCode) {
      try {
        const updated = await ShareCodeStorage.update(child.id, { isReadOnly: value });
        setShareCode(updated);
      } catch (error) {
        console.error("Error updating share code:", error);
      }
    }
  };

  const handleCopyCode = async () => {
    if (!shareCode) return;
    
    await Clipboard.setStringAsync(shareCode.code);
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!shareCode) return;

    const message = `Te comparto el acceso a ${child.name} en MiPediApp.\n\nCodigo: ${shareCode.code}\n\n${isReadOnly ? "(Solo lectura)" : "(Lectura y escritura)"}`;
    
    try {
      await Share.share({
        message,
        title: `Compartir ${child.name}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleDeleteCode = async () => {
    try {
      await ShareCodeStorage.delete(child.id);
      setShareCode(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error deleting share code:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.header}>
            <ThemedText type="h4">Compartir a {child.name}</ThemedText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
            Genera un codigo para que otro usuario pueda acceder a la informacion de {child.name}.
          </ThemedText>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Feather name="eye" size={20} color={theme.textSecondary} />
              <ThemedText type="body">Solo lectura</ThemedText>
            </View>
            <Switch
              value={isReadOnly}
              onValueChange={handleUpdateReadOnly}
              trackColor={{ false: theme.border, true: theme.primary + "80" }}
              thumbColor={isReadOnly ? theme.primary : theme.textSecondary}
            />
          </View>

          <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
            {isReadOnly
              ? "El usuario solo podra ver la informacion, no modificarla."
              : "El usuario podra ver y modificar la informacion."}
          </ThemedText>

          {shareCode ? (
            <View style={styles.codeSection}>
              <View style={[styles.codeBox, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText style={styles.codeText}>{shareCode.code}</ThemedText>
              </View>
              
              <View style={styles.codeActions}>
                <Pressable
                  onPress={handleCopyCode}
                  style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <Feather name={copied ? "check" : "copy"} size={18} color={theme.primary} />
                  <ThemedText type="small" style={{ color: theme.primary }}>
                    {copied ? "Copiado" : "Copiar"}
                  </ThemedText>
                </Pressable>
                
                <Pressable
                  onPress={handleShare}
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                >
                  <Feather name="share-2" size={18} color="#FFFFFF" />
                  <ThemedText type="small" style={{ color: "#FFFFFF" }}>
                    Compartir
                  </ThemedText>
                </Pressable>
              </View>

              <Pressable onPress={handleDeleteCode} style={styles.deleteButton}>
                <ThemedText type="small" style={{ color: theme.error }}>
                  Revocar codigo
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <Button
              onPress={handleGenerateCode}
              disabled={loading}
              style={styles.generateButton}
            >
              {loading ? "Generando..." : "Generar Codigo"}
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  container: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  description: {
    marginBottom: Spacing.xl,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  hint: {
    marginBottom: Spacing.xl,
  },
  codeSection: {
    alignItems: "center",
  },
  codeBox: {
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  codeText: {
    fontSize: 28,
    fontFamily: "Nunito_700Bold",
    letterSpacing: 4,
  },
  codeActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  generateButton: {
    width: "100%",
  },
});
