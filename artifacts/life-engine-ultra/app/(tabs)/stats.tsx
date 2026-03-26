import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { AnimatedProgressBar } from "@/src/components/AnimatedProgressBar";
import { GlassCard } from "@/src/components/GlassCard";
import { HabitCard } from "@/src/components/HabitCard";
import { LifeScoreRing } from "@/src/components/LifeScoreRing";
import { MoodSelector } from "@/src/components/MoodSelector";
import { useApp } from "@/src/store/useAppStore";
import { generateWeeklyReport } from "@/src/services/aiService";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function HeatmapCell({ active, intensity }: { active: boolean; intensity: number }) {
  const C = Colors.dark;
  const bg = active
    ? intensity > 0.8 ? C.success : intensity > 0.5 ? `${C.success}CC` : `${C.success}60`
    : "rgba(255,255,255,0.05)";
  return <View style={[styles.heatCell, { backgroundColor: bg }]} />;
}

function HabitHeatmap({ completedDates }: { completedDates: string[] }) {
  const last28 = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().split("T")[0];
  });

  return (
    <View style={styles.heatmap}>
      {last28.map((d, i) => (
        <HeatmapCell key={d} active={completedDates.includes(d)} intensity={completedDates.includes(d) ? 1 : 0} />
      ))}
    </View>
  );
}

function AddHabitSheet({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (h: any) => void }) {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const HABIT_ICONS = ["📚", "💪", "🧘", "💧", "🏃", "🎯", "✍️", "🎨", "🍎", "💤"];
  const HABIT_COLORS = [C.primary, C.success, C.accent, C.warning, C.danger, C.levelColor, C.secondary];
  const [icon, setIcon] = useState("📚");
  const [color, setColor] = useState(C.primary);
  const { Modal, TextInput, KeyboardAvoidingView } = require("react-native");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), icon, color, frequency: "daily", targetCount: 1, xpReward: 20 });
    setTitle("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: C.surface, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.handle2} />
            <Text style={[styles.sheetTitle, { color: C.text }]}>New Habit</Text>
            <TextInput
              placeholder="Habit name..."
              placeholderTextColor={C.textMuted}
              value={title}
              onChangeText={setTitle}
              style={[styles.habitInput, { color: C.text, borderColor: C.glassBorder, backgroundColor: C.card }]}
              autoFocus
            />
            <Text style={[styles.habitLabel, { color: C.textSecondary }]}>ICON</Text>
            <View style={styles.iconGrid}>
              {HABIT_ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={[styles.iconBtn, { backgroundColor: icon === ic ? `${C.primary}25` : C.card, borderColor: icon === ic ? C.primary : "rgba(255,255,255,0.08)" }]}
                >
                  <Text style={{ fontSize: 22 }}>{ic}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.habitLabel, { color: C.textSecondary }]}>COLOR</Text>
            <View style={styles.colorRow}>
              {HABIT_COLORS.map((col) => (
                <Pressable
                  key={col}
                  onPress={() => setColor(col)}
                  style={[styles.colorDot, { backgroundColor: col, borderWidth: color === col ? 3 : 0, borderColor: "#fff" }]}
                />
              ))}
            </View>
            <Pressable
              onPress={handleAdd}
              style={[styles.addHabitBtn, { backgroundColor: title.trim() ? C.primary : C.card }]}
            >
              <Text style={[styles.addHabitText, { color: title.trim() ? "#fff" : C.textMuted }]}>Add Habit</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function StatsScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const app = useApp();
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const today = new Date().toISOString().split("T")[0];

  const analyticsData = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    const completedByDay = last7.map((d) =>
      app.tasks.filter((t) => t.status === "completed" && t.completedAt?.startsWith(d)).length
    );
    const maxCompleted = Math.max(...completedByDay, 1);

    const focusHours = app.focusSessions
      .filter((s) => s.status === "completed")
      .reduce((a, s) => a + s.completedMinutes, 0) / 60;

    const moodAvg = app.moodLogs.slice(0, 7).reduce((a, m) => a + m.mood, 0) / (app.moodLogs.slice(0, 7).length || 1);
    const energyAvg = app.moodLogs.slice(0, 7).reduce((a, m) => a + m.energy, 0) / (app.moodLogs.slice(0, 7).length || 1);

    return { last7, completedByDay, maxCompleted, focusHours, moodAvg, energyAvg };
  }, [app.tasks, app.focusSessions, app.moodLogs]);

  const handleGenerateReport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingReport(true);
    try {
      const topHabit = app.habits.sort((a, b) => b.streak - a.streak)[0]?.title || "None";
      const report = await generateWeeklyReport({
        totalXP: app.profile.totalXP,
        completedTasks: app.tasks.filter((t) => t.status === "completed").length,
        focusHours: analyticsData.focusHours,
        topHabit,
        lifeScore: app.profile.lifeScore,
      });
      setWeeklyReport(report);
    } catch {
      setWeeklyReport("Keep pushing! Your consistency is building momentum. Stay focused on daily habits.");
    }
    setLoadingReport(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={["rgba(190,133,255,0.08)", "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
      />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 12, paddingBottom: 120, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: C.text }]}>Stats & Habits</Text>

        {/* Life Score */}
        <GlassCard style={styles.scoreCard} glowColor={C.primary}>
          <View style={styles.scoreRow}>
            <LifeScoreRing score={app.profile.lifeScore} size={100} />
            <View style={styles.scoreRight}>
              <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>PERFORMANCE</Text>
              {[
                { label: "Discipline", value: app.profile.disciplineScore, color: C.accent },
                { label: "Productivity", value: app.profile.productivityScore, color: C.primary },
                { label: "Focus", value: app.profile.focusScore, color: C.focusColor },
              ].map((m) => (
                <View key={m.label} style={{ marginTop: 8 }}>
                  <View style={styles.metricRow}>
                    <Text style={[styles.metricLabel, { color: C.textMuted }]}>{m.label}</Text>
                    <Text style={[styles.metricVal, { color: m.color }]}>{m.value}</Text>
                  </View>
                  <AnimatedProgressBar progress={m.value / 100} color={m.color} glowColor={m.color} height={4} />
                </View>
              ))}
            </View>
          </View>
        </GlassCard>

        {/* 7-Day Task Chart */}
        <GlassCard style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary, marginBottom: 16 }]}>7-DAY TASKS</Text>
          <View style={styles.barChart}>
            {analyticsData.completedByDay.map((count, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={[styles.barValue, { color: C.textMuted }]}>{count > 0 ? count : ""}</Text>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(count / analyticsData.maxCompleted) * 100}%`,
                        backgroundColor: count > 0 ? C.primary : "rgba(255,255,255,0.05)",
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barDay, { color: C.textMuted }]}>{DAYS[new Date(analyticsData.last7[i] + "T00:00:00").getDay()]}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Focus & Mood Stats */}
        <View style={styles.row2}>
          <GlassCard style={styles.halfCard} glowColor={C.focusColor} padding={14}>
            <MaterialCommunityIcons name="brain" size={20} color={C.focusColor} />
            <Text style={[styles.halfValue, { color: C.text }]}>{analyticsData.focusHours.toFixed(1)}h</Text>
            <Text style={[styles.halfLabel, { color: C.textMuted }]}>Total Focus</Text>
          </GlassCard>
          <GlassCard style={styles.halfCard} glowColor={C.moodColor} padding={14}>
            <Feather name="smile" size={20} color={C.moodColor} />
            <Text style={[styles.halfValue, { color: C.text }]}>{analyticsData.moodAvg.toFixed(1)}/5</Text>
            <Text style={[styles.halfLabel, { color: C.textMuted }]}>Avg Mood</Text>
          </GlassCard>
        </View>

        {/* AI Weekly Report */}
        <GlassCard style={styles.reportCard} glowColor={C.levelColor}>
          <View style={styles.reportHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>AI WEEKLY REPORT</Text>
              <Text style={[styles.reportSub, { color: C.textMuted }]}>Generated by AI coach</Text>
            </View>
            <Pressable
              onPress={handleGenerateReport}
              disabled={loadingReport}
              style={[styles.reportBtn, { backgroundColor: `${C.levelColor}25`, borderColor: `${C.levelColor}60` }]}
            >
              <MaterialCommunityIcons name="robot" size={16} color={C.levelColor} />
              <Text style={[styles.reportBtnText, { color: C.levelColor }]}>{loadingReport ? "..." : "Generate"}</Text>
            </Pressable>
          </View>
          {weeklyReport ? (
            <Text style={[styles.reportText, { color: C.text }]}>{weeklyReport}</Text>
          ) : (
            <Text style={[styles.reportPlaceholder, { color: C.textMuted }]}>
              Tap Generate to get an AI-powered analysis of your week
            </Text>
          )}
        </GlassCard>

        {/* Habits */}
        <View style={styles.habitsHeader}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>HABITS</Text>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAddHabit(true); }}
            style={[styles.addHabitIconBtn, { backgroundColor: `${C.habitColor}25`, borderColor: `${C.habitColor}50` }]}
          >
            <Feather name="plus" size={14} color={C.habitColor} />
          </Pressable>
        </View>

        {app.habits.length === 0 ? (
          <GlassCard style={styles.emptyHabit} padding={24}>
            <Feather name="repeat" size={28} color={C.textMuted} />
            <Text style={[styles.emptyTitle, { color: C.text }]}>No habits yet</Text>
            <Text style={[styles.emptyBody, { color: C.textMuted }]}>Build habits that stick</Text>
            <Pressable onPress={() => setShowAddHabit(true)} style={[styles.addEmptyBtn, { backgroundColor: C.habitColor }]}>
              <Feather name="plus" size={14} color="#fff" />
              <Text style={styles.addEmptyText}>Add Habit</Text>
            </Pressable>
          </GlassCard>
        ) : (
          app.habits.map((habit) => (
            <View key={habit.id}>
              <HabitCard
                habit={habit}
                onComplete={app.completeHabit}
                onDelete={app.deleteHabit}
                isCompletedToday={habit.completedDates.includes(today)}
              />
              <GlassCard style={styles.heatmapCard} padding={10}>
                <Text style={[styles.heatLabel, { color: C.textMuted }]}>Last 28 days</Text>
                <HabitHeatmap completedDates={habit.completedDates} />
              </GlassCard>
            </View>
          ))
        )}

        <Pressable onPress={() => setShowMood(true)} style={[styles.logMoodBtn, { backgroundColor: `${C.moodColor}20`, borderColor: `${C.moodColor}40` }]}>
          <Feather name="smile" size={18} color={C.moodColor} />
          <Text style={[styles.logMoodText, { color: C.moodColor }]}>Log Today's Mood</Text>
        </Pressable>
      </ScrollView>

      <AddHabitSheet visible={showAddHabit} onClose={() => setShowAddHabit(false)} onAdd={app.addHabit} />
      <MoodSelector visible={showMood} onClose={() => setShowMood(false)} onSubmit={app.logMood} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pageTitle: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  scoreCard: { marginBottom: 16 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  scoreRight: { flex: 1 },
  metricRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  metricLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  metricVal: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  barChart: { flexDirection: "row", gap: 6, height: 100, alignItems: "flex-end" },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barValue: { fontSize: 9, fontFamily: "Inter_400Regular" },
  barBg: { width: "100%", height: 70, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 4 },
  barDay: { fontSize: 11, fontFamily: "Inter_500Medium" },
  row2: { flexDirection: "row", gap: 8, marginBottom: 16 },
  halfCard: { flex: 1, alignItems: "center", gap: 6 },
  halfValue: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  halfLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  reportCard: { marginBottom: 20 },
  reportHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  reportSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  reportBtnText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  reportText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  reportPlaceholder: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  habitsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  addHabitIconBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emptyHabit: { alignItems: "center", gap: 10, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptyBody: { fontSize: 13, fontFamily: "Inter_400Regular" },
  addEmptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addEmptyText: { color: "#fff", fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  heatmapCard: { marginTop: -4, marginBottom: 12, borderRadius: 0 },
  heatmap: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginTop: 6 },
  heatCell: { width: 10, height: 10, borderRadius: 2 },
  heatLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  logMoodBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14, borderWidth: 1, marginTop: 8 },
  logMoodText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
  handle2: { width: 36, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 16 },
  habitInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 16 },
  habitLabel: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 10 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  iconBtn: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  colorRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  addHabitBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  addHabitText: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
