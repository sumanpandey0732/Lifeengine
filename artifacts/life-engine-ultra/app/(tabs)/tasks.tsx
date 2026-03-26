import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { AddTaskSheet } from "@/src/components/AddTaskSheet";
import { GlassCard } from "@/src/components/GlassCard";
import { TaskCard } from "@/src/components/TaskCard";
import { useApp, Task } from "@/src/store/useAppStore";

const FILTERS = ["All", "Pending", "In Progress", "Completed", "Urgent"] as const;
type Filter = typeof FILTERS[number];

export default function TasksScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const app = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const filteredTasks = useMemo(() => {
    let tasks = app.tasks;
    switch (filter) {
      case "Pending": tasks = tasks.filter((t) => t.status === "pending"); break;
      case "In Progress": tasks = tasks.filter((t) => t.status === "in_progress"); break;
      case "Completed": tasks = tasks.filter((t) => t.status === "completed"); break;
      case "Urgent": tasks = tasks.filter((t) => t.priority === "urgent"); break;
    }
    return tasks.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [app.tasks, filter]);

  const stats = useMemo(() => ({
    pending: app.tasks.filter((t) => t.status === "pending").length,
    completed: app.tasks.filter((t) => t.status === "completed").length,
    urgent: app.tasks.filter((t) => t.priority === "urgent" && t.status === "pending").length,
  }), [app.tasks]);

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={["rgba(30,144,255,0.08)", "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, borderBottomColor: C.separator }]}>
        <Text style={[styles.title, { color: C.text }]}>Tasks</Text>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAdd(true); }}
          style={[styles.addBtn, { backgroundColor: C.primary }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: "Pending", value: stats.pending, color: C.warning },
          { label: "Completed", value: stats.completed, color: C.success },
          { label: "Urgent", value: stats.urgent, color: C.danger },
        ].map((s) => (
          <GlassCard key={s.label} style={styles.statCard} padding={10}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>{s.label}</Text>
          </GlassCard>
        ))}
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setFilter(item)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === item ? C.primary : C.card,
                borderColor: filter === item ? C.primary : "rgba(255,255,255,0.08)",
              },
            ]}
          >
            <Text style={[styles.filterText, { color: filter === item ? "#fff" : C.textMuted }]}>{item}</Text>
          </Pressable>
        )}
        style={styles.filterList}
      />

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filteredTasks.length}
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard} padding={32}>
            <Feather name="check-circle" size={36} color={C.textMuted} />
            <Text style={[styles.emptyTitle, { color: C.text }]}>No tasks here</Text>
            <Text style={[styles.emptyBody, { color: C.textMuted }]}>
              {filter === "All" ? "Add your first task to get started!" : `No ${filter.toLowerCase()} tasks`}
            </Text>
            <Pressable
              onPress={() => setShowAdd(true)}
              style={[styles.addEmptyBtn, { backgroundColor: C.primary }]}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.addEmptyText}>Add Task</Text>
            </Pressable>
          </GlassCard>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={app.completeTask}
            onDelete={app.deleteTask}
          />
        )}
      />

      <AddTaskSheet visible={showAdd} onClose={() => setShowAdd(false)} onAdd={app.addTask} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold" },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  statCard: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  filterList: { flexGrow: 0 },
  filtersContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  emptyCard: { alignItems: "center", gap: 12, marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptyBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  addEmptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  addEmptyText: { color: "#fff", fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
