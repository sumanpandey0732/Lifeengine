import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("life-engine", {
      name: "Life Engine Ultra",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1E90FF",
      sound: "default",
    });
    await Notifications.setNotificationChannelAsync("screen-time", {
      name: "Screen Time Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: "#FF4444",
      sound: "default",
    });
    await Notifications.setNotificationChannelAsync("wellness", {
      name: "Wellness Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: "#00D4FF",
      sound: "default",
    });
  }

  return finalStatus === "granted";
}

export async function sendImmediateNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default", data: data ?? {} },
    trigger: null,
  });
}

export async function scheduleTaskReminder(taskTitle: string, afterSeconds: number): Promise<string> {
  if (Platform.OS === "web") return "";
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "🔥 Task Reminder",
      body: `"${taskTitle}" is waiting! Kal mat chhod yaar.`,
      sound: "default",
      data: { type: "task_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: afterSeconds,
    },
  });
}

export async function sendScreenTimeWarning(minutesLeft: number): Promise<void> {
  await sendImmediateNotification(
    "⏰ Screen Time Warning",
    `Only ${minutesLeft} min left on your daily limit. Bhai, thoda break le!`,
    { type: "screen_time_warning" }
  );
}

export async function sendScreenTimeBlockedNotification(): Promise<void> {
  await sendImmediateNotification(
    "🛑 Screen Time Limit Reached!",
    "1 hour done! Take a break. Apni aankhen aur dimag ko rest do.",
    { type: "screen_time_block" }
  );
}

export async function sendHydrationReminder(): Promise<void> {
  await sendImmediateNotification(
    "💧 Hydration Check",
    "Paani piya kya? Stay hydrated — it boosts focus!",
    { type: "hydration" }
  );
}

export async function scheduleDailyReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌅 Good Morning, Warrior!",
      body: "New day, new XP to earn. Uth ja, kaam shuru kar!",
      sound: "default",
      data: { type: "morning" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⚡ Midday Check-in",
      body: "Half the day is done — are your tasks progressing? Keep going!",
      sound: "default",
      data: { type: "midday" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 13,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌙 Evening Review",
      body: "Log your mood, review your day, plan tomorrow. Kal ke liye ready ho!",
      sound: "default",
      data: { type: "evening" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💧 Drink Water!",
      body: "2 hours gone — paani piya kya? Hydration = brain power!",
      sound: "default",
      data: { type: "hydration" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 7200,
      repeats: true,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "😴 Sleep Reminder",
      body: "It's late! Good sleep = better performance tomorrow.",
      sound: "default",
      data: { type: "sleep" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 23,
      minute: 0,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
