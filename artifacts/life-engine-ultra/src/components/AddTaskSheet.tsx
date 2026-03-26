import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Task } from "@/src/store/useAppStore";

type Priority = Task["priority"];

interface AddTaskSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, "id" | "createdAt" | "status">) => void;
}

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
const PRIORITY_COLORS = { low: Colors.dark.success, medium: Colors.dark.warning, high: Colors.dark.accent, urgent: Colors.dark.danger };
const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
const CATEGORIES = ["Work", "Study", "Health", "Personal", "Finance", "Other"];

export function AddTaskSheet({ visible, onClose, onAdd }: AddTaskSheetProps) {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("Work");
  const [minutes, setMinutes] = useState("25");

  const handleSubmit = () => {
    if (!title.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      title: title.trim(),
      priority,
      estimatedMinutes: parseInt(minutes) || 25,
      xpReward: priority === "urgent" ? 50 : priority === "high" ? 35 : priority === "medium" ? 25 : 15,
      category,
    });
    setTitle("");
    setPriority("medium");
    setCategory("Work");
    setMinutes("25");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: C.surface, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={[styles.title, { color: C.text }]}>New Task</Text>
              <Pressable onPress={onClose}><Feather name="x" size={22} color={C.textMuted} /></Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                placeholder="What needs to be done?"
                placeholderTextColor={C.textMuted}
                value={title}
                onChangeText={setTitle}
                style={[styles.input, { color: C.text, borderColor: C.glassBorder, backgroundColor: C.card }]}
                autoFocus
                multiline
                maxLength={100}
              />

              <Text style={[styles.label, { color: C.textSecondary }]}>PRIORITY</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => { setPriority(p); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[
                      styles.priorityBtn,
                      {
                        backgroundColor: priority === p ? `${PRIORITY_COLORS[p]}25` : C.card,
                        borderColor: priority === p ? PRIORITY_COLORS[p] : "rgba(255,255,255,0.1)",
                      },
                    ]}
                  >
                    <Text style={[styles.priorityBtnText, { color: priority === p ? PRIORITY_COLORS[p] : C.textMuted }]}>
                      {PRIORITY_LABELS[p]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: C.textSecondary }]}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={styles.catRow}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.catBtn,
                        {
                          backgroundColor: category === cat ? `${C.primary}25` : C.card,
                          borderColor: category === cat ? C.primary : "rgba(255,255,255,0.1)",
                        },
                      ]}
                    >
                      <Text style={[styles.catText, { color: category === cat ? C.primary : C.textMuted }]}>{cat}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={[styles.label, { color: C.textSecondary }]}>ESTIMATED TIME (min)</Text>
              <View style={styles.minuteRow}>
                {["15", "25", "45", "60", "90"].map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setMinutes(m)}
                    style={[
                      styles.minuteBtn,
                      {
                        backgroundColor: minutes === m ? `${C.secondary}20` : C.card,
                        borderColor: minutes === m ? C.secondary : "rgba(255,255,255,0.1)",
                      },
                    ]}
                  >
                    <Text style={[styles.minuteText, { color: minutes === m ? C.secondary : C.textMuted }]}>{m}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSubmit}
              style={[styles.submitBtn, { backgroundColor: title.trim() ? C.primary : C.card }]}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.submitText}>Add Task</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12, maxHeight: "90%" },
  handle: { width: 36, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 20, minHeight: 56 },
  label: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 10 },
  priorityRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  priorityBtnText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  catRow: { flexDirection: "row", gap: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  minuteRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  minuteBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  minuteText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 4 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
