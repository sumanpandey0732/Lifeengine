import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { Habit } from "@/src/store/useAppStore";

interface HabitCardProps {
  habit: Habit;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isCompletedToday: boolean;
}

export function HabitCard({ habit, onComplete, onDelete, isCompletedToday }: HabitCardProps) {
  const C = Colors.dark;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (isCompletedToday) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSequence(withSpring(1.06), withSpring(1));
    onComplete(habit.id);
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.card,
          {
            backgroundColor: isCompletedToday ? `${habit.color}15` : C.card,
            borderColor: isCompletedToday ? `${habit.color}50` : "rgba(255,255,255,0.06)",
          },
        ]}
      >
        <View style={[styles.iconBg, { backgroundColor: `${habit.color}25` }]}>
          <Text style={styles.iconText}>{habit.icon}</Text>
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>{habit.title}</Text>
          <View style={styles.meta}>
            <Feather name="zap" size={11} color={C.streakColor} />
            <Text style={[styles.streak, { color: C.streakColor }]}>{habit.streak} day streak</Text>
            <Text style={[styles.xp, { color: C.xpColor }]}>+{habit.xpReward}XP</Text>
          </View>
        </View>
        <View style={[
          styles.checkCircle,
          {
            backgroundColor: isCompletedToday ? `${habit.color}30` : "transparent",
            borderColor: isCompletedToday ? habit.color : "rgba(255,255,255,0.2)",
          },
        ]}>
          {isCompletedToday && <Feather name="check" size={14} color={habit.color} />}
        </View>
        <Pressable onPress={() => onDelete(habit.id)} style={styles.deleteBtn} hitSlop={8}>
          <Feather name="x" size={13} color={C.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streak: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  xp: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    padding: 4,
  },
});
