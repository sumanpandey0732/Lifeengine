import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { Colors } from "@/constants/colors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  glowColor?: string;
  noBorder?: boolean;
  padding?: number;
}

export function GlassCard({ children, style, glowColor, noBorder, padding = 16 }: GlassCardProps) {
  const C = Colors.dark;
  const borderColor = glowColor ? `${glowColor}40` : C.glassBorder;

  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={20} tint="dark" style={[styles.blur, { borderColor: noBorder ? "transparent" : borderColor, padding }, style]}>
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[styles.fallback, { borderColor: noBorder ? "transparent" : borderColor, backgroundColor: C.card, padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  blur: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  fallback: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
});
