import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ScreenTimeData {
  todayUsageMinutes: number;
  sessionStartMs: number | null;
  lastActiveDate: string;
  dailyLimitMinutes: number;
  detoxMode: boolean;
  detoxStartHour: number;
  detoxEndHour: number;
  weeklyUsage: number[];
  breakStreak: number;
  totalLifetimeMinutes: number;
}

const STORAGE_KEY = "life_engine_screen_time_v2";

export const DEFAULT_SCREEN_TIME: ScreenTimeData = {
  todayUsageMinutes: 0,
  sessionStartMs: null,
  lastActiveDate: new Date().toISOString().split("T")[0],
  dailyLimitMinutes: 60,
  detoxMode: false,
  detoxStartHour: 22,
  detoxEndHour: 7,
  weeklyUsage: [0, 0, 0, 0, 0, 0, 0],
  breakStreak: 0,
  totalLifetimeMinutes: 0,
};

export async function loadScreenTime(): Promise<ScreenTimeData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SCREEN_TIME };
    const data: ScreenTimeData = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    if (data.lastActiveDate !== today) {
      const dayIndex = new Date().getDay();
      const newWeekly = [...(data.weeklyUsage ?? [0, 0, 0, 0, 0, 0, 0])];
      newWeekly[dayIndex] = 0;
      return {
        ...data,
        todayUsageMinutes: 0,
        sessionStartMs: null,
        lastActiveDate: today,
        weeklyUsage: newWeekly,
      };
    }
    return data;
  } catch {
    return { ...DEFAULT_SCREEN_TIME };
  }
}

export async function saveScreenTime(data: ScreenTimeData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function calcCurrentUsage(data: ScreenTimeData): number {
  if (!data.sessionStartMs) return data.todayUsageMinutes;
  const elapsed = (Date.now() - data.sessionStartMs) / 60000;
  return data.todayUsageMinutes + elapsed;
}

export function isLimitReached(data: ScreenTimeData, currentUsage?: number): boolean {
  const usage = currentUsage ?? calcCurrentUsage(data);
  return usage >= data.dailyLimitMinutes;
}

export function isDetoxTime(data: ScreenTimeData): boolean {
  if (!data.detoxMode) return false;
  const hour = new Date().getHours();
  if (data.detoxStartHour > data.detoxEndHour) {
    return hour >= data.detoxStartHour || hour < data.detoxEndHour;
  }
  return hour >= data.detoxStartHour && hour < data.detoxEndHour;
}

export function getUsagePercent(data: ScreenTimeData, currentUsage?: number): number {
  const usage = currentUsage ?? calcCurrentUsage(data);
  return Math.min(100, (usage / data.dailyLimitMinutes) * 100);
}

export function getTimeUntilReset(): string {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
