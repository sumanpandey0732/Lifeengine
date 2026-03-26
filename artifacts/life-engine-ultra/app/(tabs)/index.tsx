import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { AnimatedProgressBar } from "@/src/components/AnimatedProgressBar";
import { GlassCard } from "@/src/components/GlassCard";
import { LifeScoreRing } from "@/src/components/LifeScoreRing";
import { MoodSelector } from "@/src/components/MoodSelector";
import { TaskCard } from "@/src/components/TaskCard";
import { XPBar } from "@/src/components/XPBar";
import { useApp } from "@/src/store/useAppStore";
import { generateDailyMotivation, suggestMicroActions } from "@/src/services/aiService";
import {
  loadScreenTime,
  calcCurrentUsage,
  getUsagePercent,
  formatMinutes,
} from "@/src/services/screenTimeService";

export default function HomeScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const app = useApp();
  const [showMood, setShowMood] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [aiNudge, setAiNudge] = useState("");
  const [microActions, setMicroActions] = useState<string[]>([]);
  const [screenUsageMin, setScreenUsageMin] = useState(0);
  const [screenLimitMin, setScreenLimitMin] = useState(60);
  const [screenPercent, setScreenPercent] = useState(0);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = app.tasks.filter((t) => t.createdAt.startsWith(today) || t.status === "pending");
  const urgentTasks = todayTasks.filter((t) => t.priority === "urgent" && t.status === "pending");
  const pendingCount = todayTasks.filter((t) => t.status === "pending").length;
  const completedCount = todayTasks.filter((t) => t.status === "completed").length;
  const latestMood = app.moodLogs[0];
  const unreadCount = app.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    loadAiContent();
    app.refreshScores();
    loadScreenUsage();
  }, []);

  const loadScreenUsage = async () => {
    const st = await loadScreenTime();
    const usage = calcCurrentUsage(st);
    setScreenUsageMin(usage);
    setScreenLimitMin(st.dailyLimitMinutes);
    setScreenPercent(getUsagePercent(st, usage));
  };

  const loadAiContent = async () => {
    try {
      const nudge = await generateDailyMotivation({
        lifeScore: app.profile.lifeScore,
        streakDays: app.profile.streakDays,
        pendingTasks: pendingCount,
        name: app.profile.name,
      });
      setAiNudge(nudge);
    } catch {
      setAiNudge(app.dailyQuote);
    }

    try {
      const actions = await suggestMicroActions({
        idleMinutes: 30,
        energyLevel: latestMood?.energy ?? 3,
        pendingTasks: todayTasks.slice(0, 3).map((t) => t.title),
      });
      setMicroActions(actions);
    } catch {
      setMicroActions([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    app.refreshScores();
    await loadAiContent();
    setRefreshing(false);
  };

  const handleMicroAction = (title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ma = app.generateMicroAction();
    app.addTask({ ...ma, title });
    app.addNotification({ title: "Micro-action added!", body: `"${title}" is waiting for you.`, type: "reminder", level: 1 });
    setMicroActions((prev) => prev.filter((a) => a !== title));
  };

  const SCORE_METRICS = [
    { label: "Discipline", value: app.profile.disciplineScore, color: C.accent },
    { label: "Productivity", value: app.profile.productivityScore, color: C.primary },
    { label: "Focus", value: app.profile.focusScore, color: C.focusColor },
  ];

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={["rgba(30,144,255,0.12)", "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 8, paddingBottom: 120, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: C.textMuted }]}>LIFE ENGINE ULTRA</Text>
            <Text style={[styles.name, { color: C.text }]}>{app.profile.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); app.markAllNotificationsRead(); }}
              style={[styles.notifBtn, { backgroundColor: C.card, borderColor: C.glassBorder }]}
            >
              <Feather name="bell" size={18} color={unreadCount > 0 ? C.primary : C.textMuted} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: C.danger }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Life Score + XP Card */}
        <GlassCard style={styles.scoreCard} glowColor={C.primary}>
          <View style={styles.scoreRow}>
            <LifeScoreRing score={app.profile.lifeScore} size={110} />
            <View style={styles.scoreRight}>
              <XPBar level={app.profile.level} xp={app.profile.xp} xpToNextLevel={app.profile.xpToNextLevel} />
              <View style={{ height: 16 }} />
              {SCORE_METRICS.map((m) => (
                <View key={m.label} style={{ marginBottom: 8 }}>
                  <View style={styles.metricRow}>
                    <Text style={[styles.metricLabel, { color: C.textMuted }]}>{m.label}</Text>
                    <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
                  </View>
                  <AnimatedProgressBar progress={m.value / 100} color={m.color} glowColor={m.color} height={4} />
                </View>
              ))}
            </View>
          </View>
        </GlassCard>

        {/* Daily Quote */}
        <GlassCard style={styles.quoteCard} glowColor={C.secondary}>
          <View style={styles.quoteRow}>
            <MaterialCommunityIcons name="lightning-bolt" size={18} color={C.secondary} />
            <Text style={[styles.quote, { color: C.text }]} numberOfLines={2}>
              {aiNudge || app.dailyQuote}
            </Text>
          </View>
        </GlassCard>

        {/* Screen Time Banner */}
        {screenPercent > 60 && (
          <Pressable onPress={() => router.push("/(tabs)/wellness")}>
            <GlassCard
              style={[
                styles.quoteCard,
                { borderColor: screenPercent >= 100 ? "rgba(255,68,68,0.5)" : "rgba(255,165,0,0.4)", marginBottom: 12 },
              ]}
              glowColor={screenPercent >= 100 ? "#FF4444" : "#FFA500"}
            >
              <View style={styles.quoteRow}>
                <Feather
                  name="clock"
                  size={16}
                  color={screenPercent >= 100 ? "#FF4444" : "#FFA500"}
                />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ color: screenPercent >= 100 ? "#FF4444" : "#FFA500", fontSize: 12, fontWeight: "700" }}>
                    {screenPercent >= 100 ? "🛑 SCREEN TIME LIMIT REACHED" : `⚠️ ${Math.round(screenPercent)}% of screen time used`}
                  </Text>
                  <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                    <View style={{ width: `${Math.min(100, screenPercent)}%`, height: "100%", backgroundColor: screenPercent >= 100 ? "#FF4444" : "#FFA500", borderRadius: 2 }} />
                  </View>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4 }}>
                    {formatMinutes(screenUsageMin)} used · {formatMinutes(screenLimitMin)} limit · Tap to manage
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        )}

        {/* Urgent Alerts */}
        {urgentTasks.length > 0 && (
          <GlassCard style={[styles.urgentCard, { borderColor: `${C.danger}50` }]} glowColor={C.danger}>
            <View style={styles.urgentHeader}>
              <Feather name="alert-triangle" size={16} color={C.danger} />
              <Text style={[styles.urgentTitle, { color: C.danger }]}>{urgentTasks.length} URGENT TASKS</Text>
            </View>
            {urgentTasks.slice(0, 2).map((t) => (
              <Text key={t.id} style={[styles.urgentTask, { color: C.textSecondary }]} numberOfLines={1}>
                • {t.title}
              </Text>
            ))}
          </GlassCard>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/focus"); }}
            style={[styles.quickBtn, { backgroundColor: `${C.primary}20`, borderColor: `${C.primary}40` }]}
          >
            <Feather name="clock" size={18} color={C.primary} />
            <Text style={[styles.quickBtnText, { color: C.primary }]}>Focus</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowMood(true); }}
            style={[styles.quickBtn, { backgroundColor: `${C.moodColor}20`, borderColor: `${C.moodColor}40` }]}
          >
            <Feather name="smile" size={18} color={C.moodColor} />
            <Text style={[styles.quickBtnText, { color: C.moodColor }]}>Mood</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/tasks"); }}
            style={[styles.quickBtn, { backgroundColor: `${C.success}20`, borderColor: `${C.success}40` }]}
          >
            <Feather name="plus" size={18} color={C.success} />
            <Text style={[styles.quickBtnText, { color: C.success }]}>Task</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/stats"); }}
            style={[styles.quickBtn, { backgroundColor: `${C.levelColor}20`, borderColor: `${C.levelColor}40` }]}
          >
            <Feather name="bar-chart-2" size={18} color={C.levelColor} />
            <Text style={[styles.quickBtnText, { color: C.levelColor }]}>Stats</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/wellness"); }}
            style={[styles.quickBtn, { backgroundColor: "rgba(236,72,153,0.15)", borderColor: "rgba(236,72,153,0.35)" }]}
          >
            <Feather name="heart" size={18} color="#EC4899" />
            <Text style={[styles.quickBtnText, { color: "#EC4899" }]}>Health</Text>
          </Pressable>
        </View>

        {/* Today Snapshot */}
        <View style={styles.snapshot}>
          {[
            { label: "Completed", value: completedCount, color: C.success, icon: "check-circle" as const },
            { label: "Pending", value: pendingCount, color: C.warning, icon: "clock" as const },
            { label: "Streak", value: `${app.profile.streakDays}d`, color: C.streakColor, icon: "zap" as const },
            { label: "Habits", value: app.habits.filter((h) => h.completedDates.includes(today)).length, color: C.habitColor, icon: "repeat" as const },
          ].map((item) => (
            <GlassCard key={item.label} style={styles.snapshotCard} padding={12}>
              <Feather name={item.icon} size={18} color={item.color} />
              <Text style={[styles.snapshotValue, { color: item.color }]}>{item.value}</Text>
              <Text style={[styles.snapshotLabel, { color: C.textMuted }]}>{item.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Mood & Energy */}
        {latestMood && (
          <GlassCard style={styles.moodCard} glowColor={C.moodColor}>
            <View style={styles.moodRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>MOOD & ENERGY</Text>
                <Text style={[styles.moodValue, { color: C.text }]}>
                  {["Terrible", "Bad", "Okay", "Good", "Amazing"][latestMood.mood - 1]}
                </Text>
              </View>
              <View style={styles.energyDots}>
                {[1, 2, 3, 4, 5].map((e) => (
                  <View
                    key={e}
                    style={[styles.energyDot, { backgroundColor: e <= latestMood.energy ? C.primary : "rgba(255,255,255,0.1)" }]}
                  />
                ))}
              </View>
              <Pressable onPress={() => setShowMood(true)} style={[styles.moodBtn, { borderColor: C.moodColor }]}>
                <Feather name="edit-2" size={13} color={C.moodColor} />
              </Pressable>
            </View>
          </GlassCard>
        )}

        {/* AI Micro-Actions */}
        {microActions.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: C.textSecondary, marginBottom: 10 }]}>AI MICRO-ACTIONS</Text>
            {microActions.map((action, i) => (
              <Pressable
                key={i}
                onPress={() => handleMicroAction(action)}
                style={[styles.microAction, { backgroundColor: C.card, borderColor: `${C.secondary}30` }]}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={14} color={C.secondary} />
                <Text style={[styles.microActionText, { color: C.text }]}>{action}</Text>
                <View style={[styles.microTime, { backgroundColor: `${C.secondary}15` }]}>
                  <Text style={[styles.microTimeText, { color: C.secondary }]}>2min</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Active Tasks Preview */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>TODAY'S TASKS</Text>
            <Pressable onPress={() => router.push("/(tabs)/tasks")}>
              <Text style={[styles.seeAll, { color: C.primary }]}>See all</Text>
            </Pressable>
          </View>
          {todayTasks.length === 0 ? (
            <GlassCard padding={24} style={styles.emptyCard}>
              <Feather name="check-circle" size={28} color={C.textMuted} />
              <Text style={[styles.emptyText, { color: C.textMuted }]}>No tasks yet. Start adding tasks to track your day!</Text>
            </GlassCard>
          ) : (
            todayTasks.slice(0, 4).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={app.completeTask}
                onDelete={app.deleteTask}
              />
            ))
          )}
        </View>

        {/* Recent Notifications */}
        {app.notifications.slice(0, 3).length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary, marginBottom: 10 }]}>NOTIFICATIONS</Text>
            {app.notifications.slice(0, 3).map((n) => (
              <GlassCard key={n.id} style={[styles.notifCard, !n.read && { borderColor: `${C.primary}40` }]} padding={12}>
                <View style={styles.notifRow}>
                  <View style={[styles.notifDot, { backgroundColor: n.read ? C.textMuted : C.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notifTitle, { color: C.text }]}>{n.title}</Text>
                    <Text style={[styles.notifBody, { color: C.textMuted }]} numberOfLines={1}>{n.body}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>

      <MoodSelector
        visible={showMood}
        onClose={() => setShowMood(false)}
        onSubmit={app.logMood}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  greeting: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
  name: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 2 },
  headerRight: { flexDirection: "row", gap: 8 },
  notifBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 9, color: "#fff", fontWeight: "700", fontFamily: "Inter_700Bold" },
  scoreCard: { marginBottom: 12 },
  scoreRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  scoreRight: { flex: 1 },
  metricRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  metricLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  metricValue: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  quoteCard: { marginBottom: 12 },
  quoteRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  quote: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 },
  urgentCard: { marginBottom: 12, borderWidth: 1 },
  urgentHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  urgentTitle: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  urgentTask: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  quickActions: { flexDirection: "row", gap: 8, marginBottom: 16 },
  quickBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  quickBtnText: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  snapshot: { flexDirection: "row", gap: 8, marginBottom: 12 },
  snapshotCard: { flex: 1, alignItems: "center", gap: 4 },
  snapshotValue: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  snapshotLabel: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 0.5, textAlign: "center" },
  moodCard: { marginBottom: 16 },
  moodRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  moodValue: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginTop: 2 },
  energyDots: { flexDirection: "row", gap: 4, flex: 1 },
  energyDot: { width: 8, height: 8, borderRadius: 4 },
  moodBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyCard: { alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  microAction: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  microActionText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  microTime: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  microTimeText: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  notifCard: { marginBottom: 6 },
  notifRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  notifDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  notifTitle: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  notifBody: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
