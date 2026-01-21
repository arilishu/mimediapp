import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/AuthNavigator";

WebBrowser.maybeCompleteAuthSession();

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "SignUp">;
};

export default function SignUpScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignUp = useCallback(async () => {
    if (!isLoaded) return;

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password: password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || "Error al crear la cuenta";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, email, password, confirmPassword, signUp]);

  const handleVerify = useCallback(async () => {
    if (!isLoaded) return;

    if (!code.trim()) {
      Alert.alert("Error", "Por favor ingresa el código de verificación");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        Alert.alert("Error", "No se pudo verificar el correo electrónico");
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || "Código inválido";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, code, signUp, setActive]);

  const handleGoogleSignUp = useCallback(async () => {
    try {
      setGoogleLoading(true);
      const { createdSessionId, setActive: setActiveSession } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/oauth-callback", { scheme: "mipediapp" }),
      });

      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
      }
    } catch (err: any) {
      if (err.message !== "User cancelled the Web Browser") {
        Alert.alert("Error", "No se pudo registrar con Google");
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [startOAuthFlow]);

  if (pendingVerification) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText style={styles.title}>Verifica tu correo</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enviamos un código de verificación a {email}
            </ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Código de verificación</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                    color: theme.text,
                    textAlign: "center",
                    letterSpacing: 8,
                  },
                ]}
                placeholder="000000"
                placeholderTextColor={theme.textDisabled}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                testID="input-verification-code"
              />
            </View>

            <Pressable
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleVerify}
              disabled={loading}
              testID="button-verify"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.buttonText}>Verificar</ThemedText>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText style={styles.title}>Crear cuenta</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Únete a MiPediApp
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Correo electrónico</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="tu@email.com"
              placeholderTextColor={theme.textDisabled}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="input-email"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Contraseña</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={theme.textDisabled}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              testID="input-password"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Confirmar contraseña</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Repite tu contraseña"
              placeholderTextColor={theme.textDisabled}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              testID="input-confirm-password"
            />
          </View>

          <Pressable
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleSignUp}
            disabled={loading}
            testID="button-signup"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.buttonText}>Crear cuenta</ThemedText>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>o</ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <Pressable
            style={[styles.googleButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={handleGoogleSignUp}
            disabled={googleLoading}
            testID="button-google-signup"
          >
            {googleLoading ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <>
                <Image
                  source={{ uri: "https://www.google.com/favicon.ico" }}
                  style={styles.googleIcon}
                />
                <ThemedText style={styles.googleButtonText}>Registrarse con Google</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
            ¿Ya tienes cuenta?{" "}
          </ThemedText>
          <Pressable onPress={() => navigation.navigate("SignIn")} testID="button-goto-signin">
            <ThemedText style={[styles.linkText, { color: theme.primary }]}>Inicia sesión</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.small,
    fontFamily: "Nunito_600SemiBold",
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontFamily: "Nunito_400Regular",
    fontSize: 16,
  },
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
    ...Typography.small,
  },
  googleButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing["3xl"],
  },
  footerText: {
    ...Typography.body,
  },
  linkText: {
    ...Typography.body,
    fontFamily: "Nunito_700Bold",
  },
});
