import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Permission for push notifications was denied");
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return token.data;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

export interface ScheduledNotification {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  trigger: Date;
  identifier?: string;
}

export async function scheduleLocalNotification(notification: ScheduledNotification): Promise<string> {
  const now = new Date();
  const triggerDate = new Date(notification.trigger);
  
  if (triggerDate <= now) {
    console.log("Notification trigger date is in the past, skipping");
    return "";
  }

  const secondsFromNow = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
    },
    identifier: notification.identifier,
  });

  console.log(`Scheduled notification "${notification.title}" for ${triggerDate.toISOString()}, id: ${id}`);
  return id;
}

export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

export function scheduleAppointmentReminders(
  appointmentId: string,
  childName: string,
  appointmentDate: Date,
  specialty?: string
): { fiveDayId: string; oneDayId: string } {
  const fiveDaysBefore = new Date(appointmentDate);
  fiveDaysBefore.setDate(fiveDaysBefore.getDate() - 5);
  fiveDaysBefore.setHours(9, 0, 0, 0);

  const oneDayBefore = new Date(appointmentDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  oneDayBefore.setHours(9, 0, 0, 0);

  const specialtyText = specialty ? ` (${specialty})` : "";

  const fiveDayId = `appointment-5d-${appointmentId}`;
  const oneDayId = `appointment-1d-${appointmentId}`;

  scheduleLocalNotification({
    title: "Recordatorio de Turno",
    body: `En 5 días tenés un turno${specialtyText} para ${childName}`,
    data: { type: "appointment", appointmentId },
    trigger: fiveDaysBefore,
    identifier: fiveDayId,
  });

  scheduleLocalNotification({
    title: "Turno Mañana",
    body: `Mañana tenés un turno${specialtyText} para ${childName}`,
    data: { type: "appointment", appointmentId },
    trigger: oneDayBefore,
    identifier: oneDayId,
  });

  return { fiveDayId, oneDayId };
}

export async function cancelAppointmentReminders(appointmentId: string): Promise<void> {
  await cancelNotification(`appointment-5d-${appointmentId}`);
  await cancelNotification(`appointment-1d-${appointmentId}`);
}

export function calculateVaccineAge(vaccineTiming: string): { months?: number; years?: number } | null {
  const timing = vaccineTiming.toLowerCase();
  
  if (timing.includes("nacimiento")) {
    return { months: 0 };
  }
  
  const monthMatch = timing.match(/(\d+)\s*mes/);
  if (monthMatch) {
    return { months: parseInt(monthMatch[1]) };
  }
  
  const yearMatch = timing.match(/(\d+)\s*año/);
  if (yearMatch) {
    return { years: parseInt(yearMatch[1]) };
  }
  
  return null;
}

export function scheduleVaccineReminders(
  vaccineId: string,
  vaccineName: string,
  childName: string,
  childBirthDate: Date,
  vaccineTiming: string
): { fiveDayId: string; oneDayId: string } | null {
  const ageInfo = calculateVaccineAge(vaccineTiming);
  if (!ageInfo) return null;

  const vaccineDate = new Date(childBirthDate);
  if (ageInfo.months !== undefined) {
    vaccineDate.setMonth(vaccineDate.getMonth() + ageInfo.months);
  }
  if (ageInfo.years !== undefined) {
    vaccineDate.setFullYear(vaccineDate.getFullYear() + ageInfo.years);
  }

  const now = new Date();
  if (vaccineDate <= now) {
    return null;
  }

  const fiveDaysBefore = new Date(vaccineDate);
  fiveDaysBefore.setDate(fiveDaysBefore.getDate() - 5);
  fiveDaysBefore.setHours(9, 0, 0, 0);

  const oneDayBefore = new Date(vaccineDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  oneDayBefore.setHours(9, 0, 0, 0);

  const ageText = ageInfo.years 
    ? `${ageInfo.years} año${ageInfo.years > 1 ? "s" : ""}`
    : `${ageInfo.months} mes${ageInfo.months !== 1 ? "es" : ""}`;

  const fiveDayId = `vaccine-5d-${vaccineId}`;
  const oneDayId = `vaccine-1d-${vaccineId}`;

  scheduleLocalNotification({
    title: "Recordatorio de Vacuna",
    body: `En 5 días tenés que vacunar a ${childName} con ${vaccineName} (a partir de los ${ageText})`,
    data: { type: "vaccine", vaccineId },
    trigger: fiveDaysBefore,
    identifier: fiveDayId,
  });

  scheduleLocalNotification({
    title: "Vacuna Mañana",
    body: `Mañana tenés que vacunar a ${childName} con ${vaccineName} (a partir de los ${ageText})`,
    data: { type: "vaccine", vaccineId },
    trigger: oneDayBefore,
    identifier: oneDayId,
  });

  return { fiveDayId, oneDayId };
}

export async function cancelVaccineReminders(vaccineId: string): Promise<void> {
  await cancelNotification(`vaccine-5d-${vaccineId}`);
  await cancelNotification(`vaccine-1d-${vaccineId}`);
}
