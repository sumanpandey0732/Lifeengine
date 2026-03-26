import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { FocusTimer } from "@/src/components/FocusTimer";
import { GlassCard } from "@/src/components/GlassCard";
import { AnimatedProgressBar } from "@/src/components/AnimatedProgressBar";
import { useApp } from "@/src/store/useAppStore";

const DURATIONS = [
  { label: "Quick", value: 5, icon: "zap" as const },
  { label: "Pomodoro", value: 25, icon: "clock" as const },
  { label: "Deep", value: 50, icon: "brain" as const },
  { label: "Flow", value: 90, icon: "activity" as const },
];

export default function FocusScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const app = useApp();
  const [duration, setDuration] = useState(25);
  const [taskTitle, setTaskTitle] = useState("");
  const [showSession, setShowSession] = useState(false);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const todayStats = (() => {
    const today = new Date().toISOString().split("T")[0];
    const todaySessions = app.focusSessions.filter((s) => s.startTime.startsWith(today));
    const completed = todaySessions.filter((s) => s.status === "completed");
    const totalMin = completed.reduce((a, s) => a + s.completedMinutes, 0);
    const avgScore = completed.length
      ? Math.round(completed.reduce((a, s) => a + s.focusScore, 0) / completed.length)
      : 0;
    return { sessions: completed.length, totalMin, avgScore };
  })();

  const handleStartFocus = () => {
    if (!taskTitle.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    app.startFocusSession(taskTitle.trim(), duration);
    setShowSession(true);
  };

  const handleComplete = (sessionId: string, completedMinutes: number) => {
    app.completeFocusSession(sessionId, completedMinutes);
    setShowSession(false);
    setTaskTitle("");
    app.addNotification({
      title: "Focus Session Complete!",
      body: `${completedMinutes} minutes of pure focus. Beast mode!`,
      type: "achievement",
      level: 1,
    });
  };

  const handleAbandon = (sessionId: string) => {
    app.abandonFocusSession(sessionId);
    setShowSession(false);
  };

  const recentSessions = app.focusSessions.slice(0, 5);

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={["rgba(0,212,255,0.08)", "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
      />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 12, paddingBottom: 120, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.pageTitle, { color: C.text }]}>Focus Mode</Text>
        <Text style={[styles.pageSubtitle, { color: C.textMuted }]}>Lock in. No distractions.</Text>

        {/* Today Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Sessions", value: todayStats.sessions, color: C.focusColor },
            { label: "Minutes", value: todayStats.totalMin, color: C.primary },
            { label: "Avg Score", value: `${todayStats.avgScore}%`, color: C.success },
          ].map((s) => (
            <GlassCard key={s.label} style={styles.statCard} padding={12}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Duration Picker */}
        <Text style={[styles.sectionTitle, { color: C.textSecondary, marginBottom: 12 }]}>SESSION LENGTH</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => (
            <Pressable
              key={d.value}
              onPress={() => { setDuration(d.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[
                styles.durationBtn,
                {
                  backgroundColor: duration === d.value ? `${C.focusColor}20` : C.card,
                  borderColor: duration === d.value ? C.focusColor : "rgba(255,255,255,0.08)",
                },
              ]}
            >
              <Feather name={d.icon} size={18} color={duration === d.value ? C.focusColor : C.textMuted} />
              <Text style={[styles.durationLabel, { color: duration === d.value ? C.focusColor : C.textMuted }]}>{d.label}</Text>
              <Text style={[styles.durationMin, { color: duration === d.value ? C.text : C.textMuted }]}>{d.value}m</Text>
            </Pressable>
          ))}
        </View>

        {/* Task Input */}
        <Text style={[styles.sectionTitle, { color: C.textSecondary, marginBottom: 12, marginTop: 20 }]}>FOCUS TARGET</Text>
        <View style={[styles.inputContainer, { backgroundColor: C.card, borderColor: taskTitle.trim() ? C.focusColor : C.glassBorder }]}>
          <MaterialCommunityIcons name="crosshairs-gps" size={18} color={taskTitle.trim() ? C.focusColor : C.textMuted} />
          <TextInput
            placeholder="What are you focusing on?"
            placeholderTextColor={C.textMuted}
            value={taskTitle}
            onChangeText={setTaskTitle}
            style={[styles.input, { color: C.text }]}
            maxLength={80}
          />
          {taskTitle.trim() && (
            <Pressable onPress={() => setTaskTitle("")}>
              <Feather name="x" size={16} color={C.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Pending Tasks Quick Select */}
        {app.tasks.filter((t) => t.status === "pending").length > 0 && (
          <View>
            <Text style={[styles.quickSelectLabel, { color: C.textMuted }]}>Quick select:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={styles.quickSelectRow}>
                {app.tasks.filter((t) => t.status === "pending").slice(0, 5).map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => { setTaskTitle(t.title); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[styles.quickSelectBtn, { backgroundColor: C.card, borderColor: "rgba(255,255,255,0.08)" }]}
                  >
                    <Text style={[styles.quickSelectText, { color: C.textSecondary }]} numberOfLines={1}>{t.title}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Start Button */}
        <Pressable
          onPress={handleStartFocus}
          disabled={!taskTitle.trim()}
          style={[
            styles.startBtn,
            {
              backgroundColor: taskTitle.trim() ? C.focusColor : "rgba(255,255,255,0.05)",
              shadowColor: taskTitle.trim() ? C.focusColor : "transparent",
            },
          ]}
        >
          <Feather name="play" size={22} color={taskTitle.trim() ? "#000" : C.textMuted} />
          <Text style={[styles.startText, { color: taskTitle.trim() ? "#000" : C.textMuted }]}>
            Start {duration}min Session
          </Text>
        </Pressable>

        {/* Focus Tips */}
        <GlassCard style={{ marginTop: 20 }} glowColor={C.focusColor}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary, marginBottom: 10 }]}>FOCUS PROTOCOL</Text>
          {[
            "Phone face-down. No social media.",
            "One task only — no task-switching.",
            "Take 5-min break after each session.",
            "Hydrate before starting.",
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: C.focusColor }]} />
              <Text style={[styles.tipText, { color: C.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary, marginBottom: 12 }]}>RECENT SESSIONS</Text>
            {recentSessions.map((s) => (
              <GlassCard key={s.id} style={styles.sessionCard} padding={12}>
                <View style={styles.sessionRow}>
                  <View style={[
                    styles.sessionStatus,
                    { backgroundColor: s.status === "completed" ? `${C.success}20` : `${C.danger}20` },
                  ]}>
                    <Feather
                      name={s.status === "completed" ? "check" : "x"}
                      size={12}
                      color={s.status === "completed" ? C.success : C.danger}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sessionTitle, { color: C.text }]} numberOfLines={1}>{s.taskTitle}</Text>
                    <Text style={[styles.sessionMeta, { color: C.textMuted }]}>
                      {s.completedMinutes}min · {s.xpEarned}XP
                    </Text>
                  </View>
                  {s.status === "completed" && (
                    <View>
                      <Text style={[styles.focusScore, { color: s.focusScore >= 80 ? C.success : s.focusScore >= 50 ? C.warning : C.danger }]}>
                        {s.focusScore}%
                      </Text>
                    </View>
                  )}
                </View>
                {s.status === "completed" && (
                  <AnimatedProgressBar
                    progress={s.focusScore / 100}
                    color={s.focusScore >= 80 ? C.success : s.focusScore >= 50 ? C.warning : C.danger}
                    height={3}
                    style={{ marginTop: 8 }}
                  />
                )}
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Active Session Modal */}
      <Modal visible={showSession && !!app.activeSession} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.sessionModal, { backgroundColor: C.background, paddingTop: insets.top }]}>
          <LinearGradient
            colors={["rgba(0,212,255,0.15)", "transparent"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
          />
          {app.activeSession && (
            <FocusTimer
              session={app.activeSession}
              onComplete={handleComplete}
              onAbandon={handleAbandon}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pageTitle: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 4 },
  pageSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  statCard: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  sectionTitle: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  durationRow: { flexDirection: "row", gap: 8 },
  durationBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1, gap: 4 },
  durationLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  durationMin: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  inputContainer: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  quickSelectLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
  quickSelectRow: { flexDirection: "row", gap: 8 },
  quickSelectBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, maxWidth: 160 },
  quickSelectText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  startBtn: { borderRadius: 16, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  startText: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 2.5 },
  tipText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  sessionCard: { marginBottom: 8 },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sessionStatus: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sessionTitle: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  sessionMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  focusScore: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  sessionModal: { flex: 1, justifyContent: "center" },
});
