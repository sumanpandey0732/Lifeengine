import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
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
import { AnimatedProgressBar } from "@/src/components/AnimatedProgressBar";
import { GlassCard } from "@/src/components/GlassCard";
import { LifeScoreRing } from "@/src/components/LifeScoreRing";
import { XPBar } from "@/src/components/XPBar";
import { useApp, MOTIVATIONAL_QUOTES } from "@/src/store/useAppStore";

const PERSONALITIES = [
  { value: "strict" as const, label: "Strict Mode", icon: "⚔️", desc: "No mercy. Pure discipline." },
  { value: "motivational" as const, label: "Motivational", icon: "🔥", desc: "Energize and inspire." },
  { value: "humorous" as const, label: "Humorous", icon: "😂", desc: "Funny but effective." },
];

const ACHIEVEMENTS = [
  { id: "first_task", title: "First Blood", desc: "Completed your first task", icon: "target", color: Colors.dark.success },
  { id: "streak_7", title: "7-Day Warrior", desc: "7 day streak maintained", icon: "zap", color: Colors.dark.warning },
  { id: "focus_1h", title: "Deep Diver", desc: "1 hour of focused work", icon: "clock", color: Colors.dark.focusColor },
  { id: "level_5", title: "Ascending", desc: "Reached Level 5", icon: "trending-up", color: Colors.dark.levelColor },
  { id: "habits_7", title: "Habit Forge", desc: "7 habits logged", icon: "repeat", color: Colors.dark.habitColor },
];

export default function ProfileScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const app = useApp();
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState(app.profile.name);
  const [showPersonality, setShowPersonality] = useState(false);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const totalFocusHours = app.focusSessions
    .filter((s) => s.status === "completed")
    .reduce((a, s) => a + s.completedMinutes, 0) / 60;

  const taskCompletionRate = app.tasks.length > 0
    ? Math.round((app.tasks.filter((t) => t.status === "completed").length / app.tasks.length) * 100)
    : 0;

  const earnedAchievements = ACHIEVEMENTS.filter((a) => {
    if (a.id === "first_task") return app.tasks.some((t) => t.status === "completed");
    if (a.id === "streak_7") return app.profile.streakDays >= 7;
    if (a.id === "focus_1h") return totalFocusHours >= 1;
    if (a.id === "level_5") return app.profile.level >= 5;
    if (a.id === "habits_7") return app.habits.length >= 1 && app.habits.some((h) => h.streak >= 7);
    return false;
  });

  const saveName = () => {
    if (nameInput.trim()) {
      app.updateDailyQuote(app.dailyQuote);
    }
    setEditName(false);
  };

  const handleClearData = () => {
    Alert.alert(
      "Reset All Data",
      "This will permanently delete all your tasks, habits, focus sessions, and progress. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={["rgba(190,133,255,0.1)", "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 12, paddingBottom: 120, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero */}
        <GlassCard style={styles.heroCard} glowColor={C.levelColor}>
          <LinearGradient
            colors={["rgba(190,133,255,0.15)", "transparent"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={styles.heroCenter}>
            <View style={[styles.avatar, { backgroundColor: `${C.levelColor}25`, borderColor: `${C.levelColor}60` }]}>
              <Text style={styles.avatarLetter}>{app.profile.name[0]?.toUpperCase() || "W"}</Text>
            </View>
            {editName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  style={[styles.nameInput, { color: C.text, borderColor: C.primary }]}
                  autoFocus
                  onSubmitEditing={saveName}
                />
                <Pressable onPress={saveName}>
                  <Feather name="check" size={18} color={C.success} />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setEditName(true)} style={styles.nameRow}>
                <Text style={[styles.name, { color: C.text }]}>{app.profile.name}</Text>
                <Feather name="edit-2" size={14} color={C.textMuted} />
              </Pressable>
            )}
            <View style={[styles.levelBadge, { backgroundColor: `${C.levelColor}25`, borderColor: `${C.levelColor}50` }]}>
              <Text style={[styles.levelText, { color: C.levelColor }]}>Level {app.profile.level} Warrior</Text>
            </View>
          </View>
          <View style={styles.xpBarWrapper}>
            <XPBar level={app.profile.level} xp={app.profile.xp} xpToNextLevel={app.profile.xpToNextLevel} />
          </View>
        </GlassCard>

        {/* Life Score */}
        <GlassCard style={styles.lifeScoreCard}>
          <View style={styles.lifeScoreRow}>
            <LifeScoreRing score={app.profile.lifeScore} size={90} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>LIFE SCORE BREAKDOWN</Text>
              <View style={{ height: 8 }} />
              {[
                { label: "Discipline (40%)", value: app.profile.disciplineScore, color: C.accent, weight: 0.4 },
                { label: "Productivity (30%)", value: app.profile.productivityScore, color: C.primary, weight: 0.3 },
                { label: "Focus (30%)", value: app.profile.focusScore, color: C.focusColor, weight: 0.3 },
              ].map((m) => (
                <View key={m.label} style={{ marginBottom: 8 }}>
                  <View style={styles.mRow}>
                    <Text style={[styles.mLabel, { color: C.textMuted }]}>{m.label}</Text>
                    <Text style={[styles.mVal, { color: m.color }]}>{m.value}</Text>
                  </View>
                  <AnimatedProgressBar progress={m.value / 100} color={m.color} height={4} glowColor={m.color} />
                </View>
              ))}
            </View>
          </View>
        </GlassCard>

        {/* All-time Stats */}
        <Text style={[styles.sectionTitle, { color: C.textSecondary, marginBottom: 12 }]}>ALL-TIME STATS</Text>
        <View style={styles.statsGrid}>
          {[
            { label: "Total XP", value: app.profile.totalXP.toLocaleString(), color: C.xpColor, icon: "star" as const },
            { label: "Tasks Done", value: app.tasks.filter((t) => t.status === "completed").length, color: C.success, icon: "check-circle" as const },
            { label: "Focus Hours", value: totalFocusHours.toFixed(1) + "h", color: C.focusColor, icon: "clock" as const },
            { label: "Completion", value: taskCompletionRate + "%", color: C.primary, icon: "trending-up" as const },
            { label: "Longest Streak", value: Math.max(0, ...app.habits.map((h) => h.longestStreak)) + "d", color: C.streakColor, icon: "zap" as const },
            { label: "Sessions", value: app.focusSessions.filter((s) => s.status === "completed").length, color: C.secondary, icon: "activity" as const },
          ].map((s) => (
            <GlassCard key={s.label} style={styles.statCard} padding={12}>
              <Feather name={s.icon} size={16} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Achievements */}
        <Text style={[styles.sectionTitle, { color: C.textSecondary, marginBottom: 12, marginTop: 8 }]}>ACHIEVEMENTS</Text>
        <View style={styles.achieveGrid}>
          {ACHIEVEMENTS.map((a) => {
            const earned = earnedAchievements.some((e) => e.id === a.id);
            return (
              <GlassCard
                key={a.id}
                style={[styles.achieveCard, !earned && { opacity: 0.35 }]}
                glowColor={earned ? a.color : undefined}
                padding={12}
              >
                <View style={[styles.achieveIcon, { backgroundColor: `${a.color}25` }]}>
                  <Feather name={a.icon as any} size={18} color={earned ? a.color : C.textMuted} />
                </View>
                <Text style={[styles.achieveTitle, { color: earned ? C.text : C.textMuted }]}>{a.title}</Text>
                <Text style={[styles.achieveDesc, { color: C.textMuted }]}>{a.desc}</Text>
              </GlassCard>
            );
          })}
        </View>

        {/* Notification Personality */}
        <Text style={[styles.sectionTitle, { color: C.textSecondary, marginBottom: 12, marginTop: 8 }]}>NOTIFICATION STYLE</Text>
        <View style={styles.personalityRow}>
          {PERSONALITIES.map((p) => (
            <Pressable
              key={p.value}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[
                styles.personalityBtn,
                {
                  backgroundColor: app.profile.notificationPersonality === p.value ? `${C.primary}20` : C.card,
                  borderColor: app.profile.notificationPersonality === p.value ? C.primary : "rgba(255,255,255,0.08)",
                },
              ]}
            >
              <Text style={{ fontSize: 20 }}>{p.icon}</Text>
              <Text style={[styles.pLabel, { color: app.profile.notificationPersonality === p.value ? C.primary : C.textSecondary }]}>{p.label}</Text>
              <Text style={[styles.pDesc, { color: C.textMuted }]}>{p.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* Today's Quote */}
        <GlassCard style={styles.quoteCard} glowColor={C.secondary}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary, marginBottom: 8 }]}>TODAY'S QUOTE</Text>
          <Text style={[styles.quote, { color: C.text }]}>{app.dailyQuote}</Text>
        </GlassCard>

        {/* Settings */}
        <View style={styles.settings}>
          <Pressable
            onPress={() => {
              const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
              app.updateDailyQuote(randomQuote);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.settingBtn, { backgroundColor: C.card, borderColor: "rgba(255,255,255,0.06)" }]}
          >
            <Feather name="refresh-cw" size={16} color={C.primary} />
            <Text style={[styles.settingText, { color: C.text }]}>Refresh Daily Quote</Text>
            <Feather name="chevron-right" size={16} color={C.textMuted} />
          </Pressable>
          <Pressable
            onPress={handleClearData}
            style={[styles.settingBtn, { backgroundColor: `${C.danger}10`, borderColor: `${C.danger}20` }]}
          >
            <Feather name="trash-2" size={16} color={C.danger} />
            <Text style={[styles.settingText, { color: C.danger }]}>Reset All Data</Text>
            <Feather name="chevron-right" size={16} color={C.danger} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroCard: { marginBottom: 16, alignItems: "center", overflow: "hidden" },
  heroCenter: { alignItems: "center", gap: 8, marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.dark.text },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameInput: { borderBottomWidth: 1, fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", minWidth: 120, paddingBottom: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  levelBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  levelText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  xpBarWrapper: { width: "100%" },
  lifeScoreCard: { marginBottom: 20 },
  lifeScoreRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  sectionTitle: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  mRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  mLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  mVal: { fontSize: 10, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  statCard: { width: "31%", alignItems: "center", gap: 4 },
  statValue: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center" },
  achieveGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  achieveCard: { width: "31%", alignItems: "center", gap: 4 },
  achieveIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  achieveTitle: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", textAlign: "center" },
  achieveDesc: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center" },
  personalityRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  personalityBtn: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
  pLabel: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", textAlign: "center" },
  pDesc: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  quoteCard: { marginBottom: 20 },
  quote: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 22, fontStyle: "italic" },
  settings: { gap: 8 },
  settingBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  settingText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
});
