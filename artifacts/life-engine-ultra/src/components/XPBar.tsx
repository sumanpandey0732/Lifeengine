import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { AnimatedProgressBar } from "./AnimatedProgressBar";

interface XPBarProps {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export function XPBar({ level, xp, xpToNextLevel }: XPBarProps) {
  const C = Colors.dark;
  const progress = xpToNextLevel > 0 ? xp / xpToNextLevel : 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.levelBadge, { backgroundColor: C.levelColor + "25", borderColor: C.levelColor + "60" }]}>
          <Text style={[styles.levelText, { color: C.levelColor }]}>LV {level}</Text>
        </View>
        <Text style={[styles.xpText, { color: C.textMuted }]}>{xp}/{xpToNextLevel} XP</Text>
      </View>
      <AnimatedProgressBar
        progress={progress}
        color={C.levelColor}
        glowColor={C.levelColor}
        height={5}
        style={{ marginTop: 6 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  levelText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  xpText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
