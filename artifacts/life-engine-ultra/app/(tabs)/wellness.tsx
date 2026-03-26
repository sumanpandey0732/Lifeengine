import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { GlassCard } from "@/src/components/GlassCard";
import { useApp } from "@/src/store/useAppStore";
import {
  loadScreenTime,
  saveScreenTime,
  calcCurrentUsage,
  getUsagePercent,
  formatMinutes,
  isDetoxTime,
} from "@/src/services/screenTimeService";

const WATER_GOAL = 8;
const SLEEP_GOAL = 8;

const DETOX_CHALLENGES = [
  { id: "1", title: "No phone for 1 hour", xp: 50, duration: "1h" },
  { id: "2", title: "No social media today", xp: 80, duration: "24h" },
  { id: "3", title: "Grayscale mode all day", xp: 60, duration: "24h" },
  { id: "4", title: "Phone off after 10PM", xp: 40, duration: "Daily" },
  { id: "5", title: "3 hour screen-free morning", xp: 100, duration: "3h" },
];

const JOURNAL_PROMPTS = [
  "What's one win I had today?",
  "What am I grateful for right now?",
  "What would make tomorrow 10% better?",
  "What's one thing I want to stop doing?",
  "What made me proud today?",
];

export default function WellnessScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const app = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [waterGlasses, setWaterGlasses] = useState(0);
  const [sleepHours, setSleepHours] = useState(0);
  const [journalText, setJournalText] = useState("");
  const [journalPrompt] = useState(JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]);
  const [journalSaved, setJournalSaved] = useState(false);
  const [detoxLimit, setDetoxLimit] = useState(60);
  const [detoxEnabled, setDetoxEnabled] = useState(false);
  const [currentUsageMin, setCurrentUsageMin] = useState(0);
  const [usagePercent, setUsagePercent] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<{ label: string; amount: number }[]>([]);
  const [expenseLabel, setExpenseLabel] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"body" | "mind" | "detox" | "money">("body");

  const waterAnim = useRef(new Animated.Value(0)).current;
  const sleepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    Animated.timing(waterAnim, {
      toValue: waterGlasses / WATER_GOAL,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [waterGlasses]);

  useEffect(() => {
    Animated.timing(sleepAnim, {
      toValue: sleepHours / SLEEP_GOAL,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [sleepHours]);

  const loadState = async () => {
    const st = await loadScreenTime();
    setDetoxEnabled(st.detoxMode);
    setDetoxLimit(st.dailyLimitMinutes);
    const usage = calcCurrentUsage(st);
    setCurrentUsageMin(usage);
    setUsagePercent(getUsagePercent(st, usage));
  };

  const addWater = () => {
    if (waterGlasses >= WATER_GOAL) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWaterGlasses((p) => p + 1);
    if (waterGlasses + 1 >= WATER_GOAL) {
      app.addXP(20);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const removeWater = () => {
    if (waterGlasses <= 0) return;
    setWaterGlasses((p) => p - 1);
  };

  const setSleep = (h: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSleepHours(h);
    if (h >= 7) app.addXP(15);
  };

  const saveJournal = () => {
    if (!journalText.trim()) return;
    app.addXP(25);
    setJournalSaved(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setJournalSaved(false), 3000);
  };

  const toggleDetox = async () => {
    const st = await loadScreenTime();
    const updated = { ...st, detoxMode: !detoxEnabled };
    await saveScreenTime(updated);
    setDetoxEnabled(!detoxEnabled);
    app.addXP(detoxEnabled ? 0 : 30);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const updateLimit = async (minutes: number) => {
    const st = await loadScreenTime();
    await saveScreenTime({ ...st, dailyLimitMinutes: minutes });
    setDetoxLimit(minutes);
  };

  const completeChallenge = (id: string, xp: number) => {
    if (completedChallenges.includes(id)) return;
    setCompletedChallenges((p) => [...p, id]);
    app.addXP(xp);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const addExpense = () => {
    if (!expenseLabel.trim() || !expenseAmount) return;
    setExpenses((p) => [...p, { label: expenseLabel, amount: parseFloat(expenseAmount) }]);
    setExpenseLabel("");
    setExpenseAmount("");
  };

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const waterFillWidth = waterAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const sleepFillWidth = sleepAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  const tabs = [
    { key: "body", label: "Body", icon: "heart" },
    { key: "mind", label: "Mind", icon: "book-open" },
    { key: "detox", label: "Detox", icon: "shield" },
    { key: "money", label: "Money", icon: "dollar-sign" },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <LinearGradient colors={["#050A14", "#060C18", "#050A14"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.headerSub, { color: C.textMuted }]}>WELLNESS</Text>
        <Text style={[styles.headerTitle, { color: C.text }]}>Daily Health</Text>
        <View style={styles.tabRow}>
          {tabs.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.tabBtn, activeTab === t.key && { backgroundColor: C.primary, borderColor: C.primary }]}
            >
              <Feather name={t.icon} size={14} color={activeTab === t.key ? "#fff" : C.textMuted} />
              <Text style={[styles.tabLabel, { color: activeTab === t.key ? "#fff" : C.textMuted }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "body" && (
          <>
            {/* Water Tracker */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Feather name="droplet" size={18} color="#00D4FF" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Water Intake</Text>
                  <Text style={styles.cardSub}>{waterGlasses}/{WATER_GOAL} glasses today</Text>
                </View>
                <Text style={styles.cardXP}>+20 XP</Text>
              </View>

              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: waterFillWidth, backgroundColor: "#00D4FF" }]} />
              </View>

              <View style={styles.waterGlasses}>
                {Array.from({ length: WATER_GOAL }).map((_, i) => (
                  <Pressable
                    key={i}
                    onPress={i < waterGlasses ? removeWater : addWater}
                    style={[styles.glass, { borderColor: i < waterGlasses ? "#00D4FF" : "rgba(255,255,255,0.15)" }]}
                  >
                    <MaterialCommunityIcons
                      name="cup-water"
                      size={22}
                      color={i < waterGlasses ? "#00D4FF" : "rgba(255,255,255,0.2)"}
                    />
                  </Pressable>
                ))}
              </View>

              <View style={styles.actionRow}>
                <Pressable onPress={removeWater} style={[styles.smallBtn, { borderColor: "rgba(255,255,255,0.2)" }]}>
                  <Feather name="minus" size={16} color="#fff" />
                  <Text style={styles.smallBtnText}>Remove</Text>
                </Pressable>
                <Pressable onPress={addWater} style={[styles.smallBtn, { backgroundColor: "#00D4FF20", borderColor: "#00D4FF" }]}>
                  <Feather name="plus" size={16} color="#00D4FF" />
                  <Text style={[styles.smallBtnText, { color: "#00D4FF" }]}>Add Glass</Text>
                </Pressable>
              </View>
            </GlassCard>

            {/* Sleep Tracker */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: "rgba(147,51,234,0.2)" }]}>
                  <Feather name="moon" size={18} color="#A855F7" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Sleep Tracker</Text>
                  <Text style={styles.cardSub}>Goal: {SLEEP_GOAL}h per night</Text>
                </View>
                <Text style={styles.cardXP}>+15 XP</Text>
              </View>

              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: sleepFillWidth, backgroundColor: "#A855F7" }]} />
              </View>

              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 10 }}>
                Last night: {sleepHours}h {sleepHours > 0 ? (sleepHours >= 7 ? "✅ Good" : sleepHours >= 5 ? "⚠️ Okay" : "❌ Poor") : ""}
              </Text>

              <View style={styles.sleepButtons}>
                {[4, 5, 6, 7, 8, 9, 10].map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => setSleep(h)}
                    style={[
                      styles.sleepHourBtn,
                      sleepHours === h && { backgroundColor: "#A855F720", borderColor: "#A855F7" },
                    ]}
                  >
                    <Text style={[styles.sleepHourText, sleepHours === h && { color: "#A855F7" }]}>{h}h</Text>
                  </Pressable>
                ))}
              </View>
            </GlassCard>

            {/* Exercise */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: "rgba(34,197,94,0.2)" }]}>
                  <Feather name="activity" size={18} color="#22C55E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Exercise Today</Text>
                  <Text style={styles.cardSub}>Quick log</Text>
                </View>
              </View>
              <View style={styles.exRow}>
                {["Walk 🚶", "Run 🏃", "Gym 💪", "Yoga 🧘", "Swim 🏊", "Cycle 🚴"].map((ex) => (
                  <Pressable
                    key={ex}
                    onPress={() => {
                      app.addXP(30);
                      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                    style={styles.exChip}
                  >
                    <Text style={styles.exText}>{ex}</Text>
                  </Pressable>
                ))}
              </View>
            </GlassCard>
          </>
        )}

        {activeTab === "mind" && (
          <>
            {/* Journal */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: "rgba(251,191,36,0.2)" }]}>
                  <Feather name="book-open" size={18} color="#FBBF24" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Daily Journal</Text>
                  <Text style={styles.cardSub}>+25 XP for writing</Text>
                </View>
              </View>

              <View style={styles.promptBox}>
                <Feather name="help-circle" size={14} color="#FBBF24" />
                <Text style={styles.promptText}>{journalPrompt}</Text>
              </View>

              <TextInput
                style={styles.journalInput}
                value={journalText}
                onChangeText={setJournalText}
                placeholder="Write your thoughts here..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <Pressable
                onPress={saveJournal}
                style={[styles.saveBtn, journalSaved && { backgroundColor: "#22C55E20", borderColor: "#22C55E" }]}
              >
                <Feather name={journalSaved ? "check" : "save"} size={16} color={journalSaved ? "#22C55E" : "#FBBF24"} />
                <Text style={[styles.saveBtnText, journalSaved && { color: "#22C55E" }]}>
                  {journalSaved ? "Saved! +25 XP" : "Save Journal"}
                </Text>
              </Pressable>
            </GlassCard>

            {/* Gratitude */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: "rgba(236,72,153,0.2)" }]}>
                  <Feather name="heart" size={18} color="#EC4899" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Gratitude List</Text>
                  <Text style={styles.cardSub}>3 things today</Text>
                </View>
                <Text style={styles.cardXP}>+15 XP</Text>
              </View>
              {[1, 2, 3].map((n) => (
                <View key={n} style={styles.gratitudeRow}>
                  <Text style={styles.gratitudeNum}>{n}.</Text>
                  <TextInput
                    style={styles.gratitudeInput}
                    placeholder={`I'm grateful for...`}
                    placeholderTextColor="rgba(255,255,255,0.25)"
                  />
                </View>
              ))}
              <Pressable onPress={() => { app.addXP(15); if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} style={styles.saveBtn}>
                <Feather name="check" size={16} color="#EC4899" />
                <Text style={[styles.saveBtnText, { color: "#EC4899" }]}>Log Gratitude +15 XP</Text>
              </Pressable>
            </GlassCard>

            {/* Breathing */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: "rgba(6,182,212,0.2)" }]}>
                  <Feather name="wind" size={18} color="#06B6D4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Box Breathing</Text>
                  <Text style={styles.cardSub}>4-4-4-4 technique</Text>
                </View>
                <Text style={styles.cardXP}>+10 XP</Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 12 }}>
                Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4x.
              </Text>
              <Pressable
                onPress={() => {
                  app.addXP(10);
                  Alert.alert("🧘 Breathing Session", "Take 4 slow cycles of box breathing.\n\nInhale 4s → Hold 4s → Exhale 4s → Hold 4s\n\nYou got this!");
                }}
                style={[styles.saveBtn, { borderColor: "#06B6D4" }]}
              >
                <Feather name="play" size={16} color="#06B6D4" />
                <Text style={[styles.saveBtnText, { color: "#06B6D4" }]}>Start Breathing +10 XP</Text>
              </Pressable>
            </GlassCard>
          </>
        )}

        {activeTab === "detox" && (
          <>
            {/* Screen Time Overview */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: "rgba(30,144,255,0.2)" }]}>
                  <Feather name="smartphone" size={18} color="#1E90FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Screen Time Today</Text>
                  <Text style={styles.cardSub}>Limit: {formatMinutes(detoxLimit)}</Text>
                </View>
              </View>

              <View style={styles.usageRow}>
                <View style={styles.usageStat}>
                  <Text style={styles.usageNum}>{formatMinutes(currentUsageMin)}</Text>
                  <Text style={styles.usageLabel}>Used</Text>
                </View>
                <View style={styles.usageStat}>
                  <Text style={[styles.usageNum, { color: usagePercent > 80 ? "#FF4444" : "#22C55E" }]}>
                    {Math.round(usagePercent)}%
                  </Text>
                  <Text style={styles.usageLabel}>Of Limit</Text>
                </View>
                <View style={styles.usageStat}>
                  <Text style={styles.usageNum}>{formatMinutes(Math.max(0, detoxLimit - currentUsageMin))}</Text>
                  <Text style={styles.usageLabel}>Remaining</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${usagePercent}%`, backgroundColor: usagePercent > 80 ? "#FF4444" : "#1E90FF" }]} />
              </View>
            </GlassCard>

            {/* Limit Setter */}
            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>Set Daily Limit</Text>
              <View style={styles.limitBtns}>
                {[30, 45, 60, 90, 120].map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => updateLimit(m)}
                    style={[styles.limitBtn, detoxLimit === m && { backgroundColor: "#1E90FF20", borderColor: "#1E90FF" }]}
                  >
                    <Text style={[styles.limitBtnText, detoxLimit === m && { color: "#1E90FF" }]}>{m}m</Text>
                  </Pressable>
                ))}
              </View>
            </GlassCard>

            {/* Detox Mode */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: detoxEnabled ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)" }]}>
                  <Feather name="shield" size={18} color={detoxEnabled ? "#22C55E" : "#666"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Digital Detox Mode</Text>
                  <Text style={styles.cardSub}>{detoxEnabled ? "Active — blocks after 10PM" : "Tap to activate"}</Text>
                </View>
                <Pressable onPress={toggleDetox} style={[styles.toggleBtn, { backgroundColor: detoxEnabled ? "#22C55E" : "rgba(255,255,255,0.1)" }]}>
                  <Text style={styles.toggleText}>{detoxEnabled ? "ON" : "OFF"}</Text>
                </Pressable>
              </View>
              {detoxEnabled && (
                <View style={styles.detoxActive}>
                  <Text style={{ color: "#22C55E", fontSize: 13 }}>
                    ✅ Detox active: blocks 10PM–7AM. +30 XP earned today!
                  </Text>
                </View>
              )}
            </GlassCard>

            {/* Detox Challenges */}
            <Text style={styles.sectionTitle}>Detox Challenges</Text>
            {DETOX_CHALLENGES.map((ch) => {
              const done = completedChallenges.includes(ch.id);
              return (
                <GlassCard key={ch.id} style={[styles.challengeCard, done && { opacity: 0.6 }]}>
                  <View style={styles.challengeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.challengeTitle}>{ch.title}</Text>
                      <Text style={styles.challengeSub}>{ch.duration} · +{ch.xp} XP</Text>
                    </View>
                    <Pressable
                      onPress={() => completeChallenge(ch.id, ch.xp)}
                      style={[styles.challengeBtn, done && { backgroundColor: "#22C55E20", borderColor: "#22C55E" }]}
                    >
                      <Feather name={done ? "check" : "play"} size={14} color={done ? "#22C55E" : "#1E90FF"} />
                      <Text style={[styles.challengeBtnText, done && { color: "#22C55E" }]}>
                        {done ? "Done!" : "Start"}
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              );
            })}
          </>
        )}

        {activeTab === "money" && (
          <>
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: "rgba(251,191,36,0.2)" }]}>
                  <Feather name="dollar-sign" size={18} color="#FBBF24" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Expense Tracker</Text>
                  <Text style={styles.cardSub}>Today's spend</Text>
                </View>
                <Text style={[styles.usageNum, { color: totalExpense > 500 ? "#FF4444" : "#22C55E" }]}>
                  ₹{totalExpense.toFixed(0)}
                </Text>
              </View>

              <View style={styles.expenseInput}>
                <TextInput
                  style={styles.expField}
                  value={expenseLabel}
                  onChangeText={setExpenseLabel}
                  placeholder="What for?"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
                <TextInput
                  style={[styles.expField, { width: 80 }]}
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  placeholder="₹"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="numeric"
                />
                <Pressable onPress={addExpense} style={styles.expAddBtn}>
                  <Feather name="plus" size={18} color="#FBBF24" />
                </Pressable>
              </View>

              {expenses.map((e, i) => (
                <View key={i} style={styles.expenseItem}>
                  <Text style={styles.expenseLabel}>{e.label}</Text>
                  <Text style={styles.expenseAmt}>₹{e.amount}</Text>
                </View>
              ))}

              {expenses.length === 0 && (
                <Text style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 12, fontSize: 13 }}>
                  No expenses logged yet. Track your spending!
                </Text>
              )}
            </GlassCard>

            {/* Savings Goal */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: "rgba(34,197,94,0.2)" }]}>
                  <Feather name="target" size={18} color="#22C55E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>No-Spend Streak</Text>
                  <Text style={styles.cardSub}>Days under ₹200 budget</Text>
                </View>
                <Text style={styles.cardXP}>+20 XP/day</Text>
              </View>
              <Pressable
                onPress={() => {
                  app.addXP(20);
                  Alert.alert("💰 Streak!", "Under budget today! +20 XP earned. Keep saving!");
                }}
                style={[styles.saveBtn, { borderColor: "#22C55E" }]}
              >
                <Feather name="check-circle" size={16} color="#22C55E" />
                <Text style={[styles.saveBtnText, { color: "#22C55E" }]}>Mark Today As Under Budget</Text>
              </Pressable>
            </GlassCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 14,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    marginBottom: 14,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,212,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  cardSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 1,
  },
  cardXP: {
    color: "#FBBF24",
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  waterGlasses: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
    justifyContent: "center",
  },
  glass: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  smallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  smallBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  sleepButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sleepHourBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  sleepHourText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  promptBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(251,191,36,0.1)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
  },
  promptText: {
    color: "#FBBF24",
    fontSize: 13,
    flex: 1,
    fontStyle: "italic",
  },
  journalInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: 14,
    fontSize: 14,
    minHeight: 110,
    marginBottom: 12,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  gratitudeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  gratitudeNum: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    width: 18,
  },
  gratitudeInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: 10,
    fontSize: 14,
  },
  usageRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  usageStat: {
    flex: 1,
    alignItems: "center",
  },
  usageNum: {
    color: "#1E90FF",
    fontSize: 18,
    fontWeight: "700",
  },
  usageLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
  },
  limitBtns: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  },
  limitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  limitBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toggleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  detoxActive: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 2,
  },
  challengeCard: {
    marginBottom: 10,
    padding: 14,
  },
  challengeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  challengeTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  challengeSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 2,
  },
  challengeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(30,144,255,0.5)",
    backgroundColor: "rgba(30,144,255,0.1)",
  },
  challengeBtnText: {
    color: "#1E90FF",
    fontSize: 13,
    fontWeight: "700",
  },
  expenseInput: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  expField: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: "#fff",
    padding: 10,
    fontSize: 13,
  },
  expAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(251,191,36,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  expenseLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  expenseAmt: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "700",
  },
  exRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  exChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  exText: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "600",
  },
});
