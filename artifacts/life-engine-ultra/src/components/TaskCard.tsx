import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { Task } from "@/src/store/useAppStore";

const PRIORITY_COLORS = {
  low: Colors.dark.success,
  medium: Colors.dark.warning,
  high: Colors.dark.accent,
  urgent: Colors.dark.danger,
};

const PRIORITY_LABELS = { low: "LOW", medium: "MED", high: "HIGH", urgent: "!!!" };

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPress?: (task: Task) => void;
}

export function TaskCard({ task, onComplete, onDelete, onPress }: TaskCardProps) {
  const C = Colors.dark;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const priorityColor = PRIORITY_COLORS[task.priority];
  const isCompleted = task.status === "completed";
  const isMissed = task.status === "missed";

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSpring(0.95, {}, () => { scale.value = withSpring(1); });
    onComplete(task.id);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    opacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => onDelete(task.id), 250);
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => onPress?.(task)}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1, borderLeftColor: priorityColor, borderLeftWidth: 3, backgroundColor: isCompleted ? "rgba(0,230,118,0.04)" : isMissed ? "rgba(255,23,68,0.04)" : C.card }]}
      >
        <View style={styles.row}>
          <Pressable onPress={handleComplete} style={[styles.checkBtn, { borderColor: isCompleted ? C.success : priorityColor + "80" }]}>
            {isCompleted ? (
              <Feather name="check" size={14} color={C.success} />
            ) : (
              <View style={[styles.checkInner, { backgroundColor: priorityColor + "20" }]} />
            )}
          </Pressable>
          <View style={styles.content}>
            <Text style={[styles.title, { color: isCompleted ? C.textMuted : C.text, textDecorationLine: isCompleted ? "line-through" : "none" }]} numberOfLines={1}>
              {task.title}
            </Text>
            <View style={styles.meta}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "20" }]}>
                <Text style={[styles.priorityText, { color: priorityColor }]}>{PRIORITY_LABELS[task.priority]}</Text>
              </View>
              <Text style={[styles.metaText, { color: C.textMuted }]}>
                {task.estimatedMinutes}min
              </Text>
              <MaterialCommunityIcons name="star-four-points" size={10} color={C.xpColor} />
              <Text style={[styles.metaText, { color: C.xpColor }]}>{task.xpReward}XP</Text>
            </View>
          </View>
          <Pressable onPress={handleDelete} hitSlop={8}>
            <Feather name="trash-2" size={15} color={C.textMuted} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
