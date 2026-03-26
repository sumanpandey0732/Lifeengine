import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MOODS = [
  { value: 1 as const, icon: "😣", label: "Terrible" },
  { value: 2 as const, icon: "😕", label: "Bad" },
  { value: 3 as const, icon: "😐", label: "Okay" },
  { value: 4 as const, icon: "😊", label: "Good" },
  { value: 5 as const, icon: "🔥", label: "Amazing" },
];

interface MoodSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (mood: 1 | 2 | 3 | 4 | 5, energy: 1 | 2 | 3 | 4 | 5) => void;
}

function MoodButton({ item, selected, onPress }: { item: typeof MOODS[0]; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          scale.value = withSpring(1.2, {}, () => { scale.value = withSpring(1); });
          onPress();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={[styles.moodBtn, selected && { backgroundColor: "rgba(30,144,255,0.2)", borderColor: Colors.dark.primary }]}
      >
        <Text style={styles.moodIcon}>{item.icon}</Text>
        <Text style={[styles.moodLabel, { color: selected ? Colors.dark.primary : Colors.dark.textMuted }]}>{item.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function MoodSelector({ visible, onClose, onSubmit }: MoodSelectorProps) {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(mood, energy);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: C.surface, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: C.text }]}>How are you feeling?</Text>

          <Text style={[styles.section, { color: C.textSecondary }]}>MOOD</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <MoodButton key={m.value} item={m} selected={mood === m.value} onPress={() => setMood(m.value)} />
            ))}
          </View>

          <Text style={[styles.section, { color: C.textSecondary }]}>ENERGY LEVEL</Text>
          <View style={styles.energyRow}>
            {[1, 2, 3, 4, 5].map((e) => (
              <Pressable
                key={e}
                onPress={() => { setEnergy(e as 1 | 2 | 3 | 4 | 5); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  styles.energyDot,
                  {
                    backgroundColor: e <= energy ? C.primary : "rgba(255,255,255,0.1)",
                    width: e === 5 ? 44 : 36,
                    height: e === 5 ? 44 : 36,
                  },
                ]}
              >
                <Text style={[styles.energyNum, { color: e <= energy ? "#fff" : C.textMuted }]}>{e}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={handleSubmit} style={[styles.submitBtn, { backgroundColor: C.primary }]}>
            <Text style={styles.submitText}>Log Mood</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12 },
  handle: { width: 36, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 20, textAlign: "center" },
  section: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 12 },
  moodRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  moodBtn: { alignItems: "center", gap: 4, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: "transparent" },
  moodIcon: { fontSize: 28 },
  moodLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  energyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  energyDot: { borderRadius: 100, alignItems: "center", justifyContent: "center" },
  energyNum: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
