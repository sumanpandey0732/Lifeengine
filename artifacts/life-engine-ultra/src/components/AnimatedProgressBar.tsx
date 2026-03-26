import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";

interface AnimatedProgressBarProps {
  progress: number;
  color: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
  glowColor?: string;
}

export function AnimatedProgressBar({
  progress,
  color,
  backgroundColor = "rgba(255,255,255,0.08)",
  height = 6,
  style,
  glowColor,
}: AnimatedProgressBarProps) {
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withTiming(Math.min(1, Math.max(0, progress)), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${anim.value * 100}%`,
  }));

  return (
    <View style={[{ height, backgroundColor, borderRadius: height / 2, overflow: "hidden" }, style]}>
      <Animated.View
        style={[
          barStyle,
          {
            height,
            backgroundColor: color,
            borderRadius: height / 2,
            shadowColor: glowColor || color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
          },
        ]}
      />
    </View>
  );
}
