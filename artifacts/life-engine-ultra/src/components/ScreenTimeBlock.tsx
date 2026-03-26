import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { getTimeUntilReset, formatMinutes } from "@/src/services/screenTimeService";

const { width, height } = Dimensions.get("window");

const BREAK_QUOTES = [
  "Bhai, teri aankhen bhi kuch deserve karti hain! 😤",
  "Real warriors rest. Take your break.",
  "1 hour done. Dimag ko cool karo.",
  "The grind doesn't stop — but YOU need to pause.",
  "Screen break = Level up irl. Go do it.",
  "Uth, pani pi, thoda chal. Back stronger.",
  "Your future self says: thank you for the break.",
  "Step away. Come back with 2x focus.",
];

interface Props {
  visible: boolean;
  usedMinutes: number;
  limitMinutes: number;
  onOverride: () => void;
  isDetoxTime?: boolean;
}

export function ScreenTimeBlock({ visible, usedMinutes, limitMinutes, onOverride, isDetoxTime }: Props) {
  const C = Colors.dark;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [overrideCount, setOverrideCount] = useState(0);
  const [quote] = useState(BREAK_QUOTES[Math.floor(Math.random() * BREAK_QUOTES.length)]);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const startHold = () => {
    let progress = 0;
    holdTimer.current = setInterval(() => {
      progress += 10;
      setHoldProgress(progress);
      Animated.timing(holdAnim, { toValue: progress / 100, duration: 100, useNativeDriver: false }).start();
      if (progress >= 100) {
        clearInterval(holdTimer.current!);
        setHoldProgress(0);
        holdAnim.setValue(0);
        setOverrideCount((c) => c + 1);
        onOverride();
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, 100);
  };

  const cancelHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    setHoldProgress(0);
    Animated.timing(holdAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const holdWidth = holdAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={["#010814", "#050A14", "#080F1E"]}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={isDetoxTime ? ["#FF4444", "#CC0000"] : ["#1E90FF", "#00D4FF"]}
            style={styles.iconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name={isDetoxTime ? "moon" : "clock"} size={52} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>
          {isDetoxTime ? "🌙 Detox Time" : "⏰ Screen Time Limit"}
        </Text>

        <Text style={styles.subtitle}>
          {isDetoxTime
            ? "Digital detox is active right now."
            : `You've used Life Engine for ${formatMinutes(usedMinutes)} today.`}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{formatMinutes(usedMinutes)}</Text>
            <Text style={styles.statLabel}>Used Today</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.1)" }]}>
            <Text style={styles.statNum}>{formatMinutes(limitMinutes)}</Text>
            <Text style={styles.statLabel}>Daily Limit</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.1)" }]}>
            <Text style={styles.statNum}>{getTimeUntilReset()}</Text>
            <Text style={styles.statLabel}>Resets In</Text>
          </View>
        </View>

        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>"{quote}"</Text>
        </View>

        <View style={styles.breakActivities}>
          <Text style={styles.breakTitle}>Do this instead:</Text>
          <View style={styles.actRow}>
            {["💧 Drink water", "🚶 Walk 5 min", "🧘 Deep breaths", "📖 Read"].map((a) => (
              <View key={a} style={styles.actChip}>
                <Text style={styles.actText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.overrideSection}>
          <Text style={styles.overrideHint}>
            Hold to override {overrideCount > 0 ? `(${overrideCount}x used — discipline -10 XP)` : "(costs discipline XP)"}
          </Text>
          <Pressable
            onPressIn={startHold}
            onPressOut={cancelHold}
            style={styles.overrideBtn}
          >
            <View style={styles.overrideBg}>
              <Animated.View style={[styles.overrideFill, { width: holdWidth }]} />
              <Text style={styles.overrideBtnText}>
                {holdProgress > 0 ? `Hold... ${holdProgress}%` : "Hold 3s to Override"}
              </Text>
            </View>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconWrap: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
    width: "100%",
    overflow: "hidden",
  },
  statBox: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  statNum: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E90FF",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  quoteCard: {
    backgroundColor: "rgba(30,144,255,0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(30,144,255,0.3)",
    padding: 16,
    marginBottom: 20,
    width: "100%",
  },
  quoteText: {
    fontSize: 15,
    color: "#00D4FF",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 22,
  },
  breakActivities: {
    width: "100%",
    marginBottom: 28,
  },
  breakTitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 10,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  actRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  actChip: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  actText: {
    color: "#fff",
    fontSize: 12,
  },
  overrideSection: {
    width: "100%",
    alignItems: "center",
  },
  overrideHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 10,
    textAlign: "center",
  },
  overrideBtn: {
    width: "100%",
  },
  overrideBg: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    height: 50,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  overrideFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255,68,68,0.35)",
  },
  overrideBtnText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
  },
});
