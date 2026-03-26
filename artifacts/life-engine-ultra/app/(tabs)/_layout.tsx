import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { ScreenTimeBlock } from "@/src/components/ScreenTimeBlock";
import {
  loadScreenTime,
  saveScreenTime,
  calcCurrentUsage,
  isLimitReached,
  isDetoxTime,
  ScreenTimeData,
  DEFAULT_SCREEN_TIME,
} from "@/src/services/screenTimeService";
import {
  requestNotificationPermission,
  sendScreenTimeWarning,
  sendScreenTimeBlockedNotification,
  scheduleDailyReminders,
} from "@/src/services/notificationService";

function useScreenTime() {
  const [screenData, setScreenData] = useState<ScreenTimeData>(DEFAULT_SCREEN_TIME);
  const [blocked, setBlocked] = useState(false);
  const [currentUsage, setCurrentUsage] = useState(0);
  const warningsSent = useRef<Set<number>>(new Set());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initScreenTime();
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const initScreenTime = async () => {
    await requestNotificationPermission();
    await scheduleDailyReminders();

    let data = await loadScreenTime();
    data = { ...data, sessionStartMs: Date.now() };
    await saveScreenTime(data);
    setScreenData(data);
    startTicker(data);

    AppState.addEventListener("change", async (nextState) => {
      if (nextState === "active") {
        let fresh = await loadScreenTime();
        fresh = { ...fresh, sessionStartMs: Date.now() };
        await saveScreenTime(fresh);
        setScreenData(fresh);
        setBlocked(isLimitReached(fresh) || isDetoxTime(fresh));
      } else if (nextState === "background" || nextState === "inactive") {
        const current = await loadScreenTime();
        const usage = calcCurrentUsage(current);
        const dayIndex = new Date().getDay();
        const newWeekly = [...current.weeklyUsage];
        newWeekly[dayIndex] = Math.round(usage);
        const updated = {
          ...current,
          todayUsageMinutes: usage,
          sessionStartMs: null,
          weeklyUsage: newWeekly,
          totalLifetimeMinutes: current.totalLifetimeMinutes + (usage - current.todayUsageMinutes),
        };
        await saveScreenTime(updated);
      }
    });
  };

  const startTicker = (initialData: ScreenTimeData) => {
    tickRef.current = setInterval(async () => {
      const data = await loadScreenTime();
      const usage = calcCurrentUsage(data);
      setCurrentUsage(usage);

      const limitReached = isLimitReached(data, usage);
      const detox = isDetoxTime(data);
      setBlocked(limitReached || detox);

      if (limitReached && !warningsSent.current.has(-1)) {
        warningsSent.current.add(-1);
        await sendScreenTimeBlockedNotification();
      }

      const minutesLeft = data.dailyLimitMinutes - usage;
      for (const warnAt of [10, 5]) {
        if (minutesLeft <= warnAt && minutesLeft > warnAt - 1 && !warningsSent.current.has(warnAt)) {
          warningsSent.current.add(warnAt);
          await sendScreenTimeWarning(warnAt);
        }
      }
    }, 30000);
  };

  const handleOverride = async () => {
    const data = await loadScreenTime();
    const extended = { ...data, dailyLimitMinutes: data.dailyLimitMinutes + 10 };
    await saveScreenTime(extended);
    setScreenData(extended);
    setBlocked(false);
  };

  return { screenData, blocked, currentUsage, handleOverride };
}

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tasks">
        <Icon sf={{ default: "checkmark.square", selected: "checkmark.square.fill" }} />
        <Label>Tasks</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="focus">
        <Icon sf={{ default: "timer", selected: "timer.circle.fill" }} />
        <Label>Focus</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wellness">
        <Icon sf={{ default: "heart", selected: "heart.fill" }} />
        <Label>Health</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Stats</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Me</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { screenData, blocked, currentUsage, handleOverride } = useScreenTime();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: C.tabActive,
          tabBarInactiveTintColor: C.tabInactive,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : C.tabBar,
            borderTopWidth: 1,
            borderTopColor: C.tabBarBorder,
            elevation: 0,
            paddingBottom: isWeb ? 0 : insets.bottom,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: C.tabBar }]} />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="house.fill" tintColor={color} size={22} />
              ) : (
                <Feather name="home" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Tasks",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="checkmark.square.fill" tintColor={color} size={22} />
              ) : (
                <Feather name="check-square" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="focus"
          options={{
            title: "Focus",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="timer" tintColor={color} size={22} />
              ) : (
                <Feather name="clock" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="wellness"
          options={{
            title: "Health",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="heart.fill" tintColor={color} size={22} />
              ) : (
                <Feather name="heart" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="chart.bar.fill" tintColor={color} size={22} />
              ) : (
                <Feather name="bar-chart-2" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Me",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="person.fill" tintColor={color} size={22} />
              ) : (
                <Feather name="user" size={22} color={color} />
              ),
          }}
        />
      </Tabs>

      <ScreenTimeBlock
        visible={blocked}
        usedMinutes={currentUsage}
        limitMinutes={screenData.dailyLimitMinutes}
        onOverride={handleOverride}
        isDetoxTime={isDetoxTime(screenData)}
      />
    </>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({});
