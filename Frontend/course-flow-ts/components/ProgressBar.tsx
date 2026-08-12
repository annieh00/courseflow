// components/ProgressBar.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface ProgressBarProps {
  progress: number; // 0 to 1
  width?: number;
  height?: number;
  completedColor?: string;
  remainingColor?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({
  progress,
  width = 300,
  height = 20,
  completedColor = "#C8102E",
  remainingColor = "#FFC72C",
  showPercentage = true,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor: remainingColor,
          borderRadius: height / 2,
        },
      ]}
    >
      <View style={styles.fillRow}>
        {/* filled */}
        <View
          style={{
            flex: clamped,
            backgroundColor: completedColor,
          }}
        />
        {/* remaining */}
        <View
          style={{
            flex: 1 - clamped,
            backgroundColor: "transparent",
          }}
        />
      </View>

      {showPercentage && (
        <View pointerEvents="none" style={styles.textOverlay}>
          <Text style={styles.percentageText}>{Math.round(clamped * 100)}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  fillRow: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },
  textOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  percentageText: {
    fontWeight: "bold",
    color: "#000",
  },
});