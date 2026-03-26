import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { Colors } from "@/constants/colors";
import { FocusSession } from "@/src/store/useAppStore";

interface FocusTimerProps {
  session: FocusSession;
  onComplete: (sessionId: string, completedMinutes: number) => void;
  onAbandon: (sessionId: string) => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function FocusTimer({ session, onComplete, onAbandon }: FocusTimerProps) {
  const C = Colors.dark;
  const totalSeconds = session.durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useSharedValue(1);

  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = secondsLeft / totalSeconds;

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(withTiming(1.03, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseAnim.value }] }));

  const startTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const completedMin = Math.round((totalSeconds - 0) / 60);
          onComplete(session.id, completedMin);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [session.id, totalSeconds, onComplete]);

  useEffect(() => {
    startTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const togglePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPaused) {
      startTimer();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    setIsPaused((p) => !p);
  };

  const handleAbandon = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const completedMin = Math.round((totalSeconds - secondsLeft) / 60);
    onAbandon(session.id);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <View style={styles.container}>
      <Text style={[styles.sessionTitle, { color: C.textSecondary }]} numberOfLines={1}>
        {session.taskTitle}
      </Text>

      <Animated.View style={[styles.ringContainer, pulseStyle]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} fill="transparent"
          />
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={C.focusColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.center}>
            <Text style={[styles.timer, { color: C.text }]}>{timeStr}</Text>
            <Text style={[styles.timerLabel, { color: C.textMuted }]}>{isPaused ? "PAUSED" : "FOCUSING"}</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.controls}>
        <Pressable onPress={handleAbandon} style={[styles.controlBtn, { backgroundColor: "rgba(255,23,68,0.15)", borderColor: "rgba(255,23,68,0.3)" }]}>
          <Feather name="x" size={20} color={C.danger} />
        </Pressable>
        <Pressable onPress={togglePause} style={[styles.mainBtn, { backgroundColor: C.primary }]}>
          <Feather name={isPaused ? "play" : "pause"} size={28} color="#fff" />
        </Pressable>
        <View style={[styles.controlBtn, { backgroundColor: "transparent", borderColor: "transparent" }]}>
          <MaterialCommunityIcons name="brain" size={20} color={C.textMuted} />
        </View>
      </View>

      <Text style={[styles.motivator, { color: C.textMuted }]}>
        {secondsLeft < 120 ? "Almost there! Push through!" : isPaused ? "Resume when ready" : "Stay locked in. No distractions."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 24, paddingVertical: 20 },
  sessionTitle: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center" },
  ringContainer: { position: "relative" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  timer: { fontSize: 48, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: -2 },
  timerLabel: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", letterSpacing: 3, marginTop: 4 },
  controls: { flexDirection: "row", alignItems: "center", gap: 20 },
  controlBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  mainBtn: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", shadowColor: Colors.dark.primary, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  motivator: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});
