import { Text } from "@/components/Themed";
import React from "react";
import { StyleSheet, useColorScheme } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { PersonDetails } from "../db/schema";

interface SeniorityGraphProps {
  historicalData: PersonDetails[];
}

export default function SeniorityGraph({
  historicalData,
}: SeniorityGraphProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const themeTextColor = isDark ? "#FFFFFF" : "#1A1A1A";
  const themeSubTextColor = isDark ? "#A0A0A0" : "#666666";

  if (historicalData.length < 2) return null;

  // 1. Reverse data arrays to follow left-to-right chronological formatting
  const chartData = [...historicalData].reverse();

  // Adjusted paddingLeft down since we no longer need space for Y-axis numbers
  const graphWidth = 280;
  const graphHeight = 150;
  const paddingLeft = 20;
  const paddingBottom = 25;
  const paddingTop = 25;
  const paddingRight = 20;

  const chartWidth = graphWidth - paddingLeft - paddingRight;
  const chartHeight = graphHeight - paddingTop - paddingBottom;

  const seniorityNumbers = chartData.map((d) => Number(d.seniorityNumber || 0));
  const maxSeniority = Math.max(...seniorityNumbers);
  const minSeniority = Math.min(...seniorityNumbers);
  const seniorityDiff = maxSeniority - minSeniority || 1;

  // Add 15% padding to the boundaries so text tags don't clip at the edges
  const yMaxBoundary = maxSeniority + seniorityDiff * 0.15;
  const yMinBoundary = Math.max(0, minSeniority - seniorityDiff * 0.15);
  const totalYRange = yMaxBoundary - yMinBoundary || 1;

  const formatIsoToGraphLabel = (isoString: string) => {
    try {
      const dateObj = new Date(isoString);
      return dateObj.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  // 2. COORDINATE MATH ENGINE (Flipped scaling)
  const pointCoordinates = chartData.map((node, index) => {
    const x = paddingLeft + (index / (chartData.length - 1)) * chartWidth;
    const rankValue = Number(node.seniorityNumber || 0);

    // Higher numerical value = Closer to the top (paddingTop)
    // Smaller numerical value = Closer to the bottom (paddingTop + chartHeight)
    const ratio = (yMaxBoundary - rankValue) / totalYRange;
    const y = paddingTop + ratio * chartHeight;

    return {
      x,
      y,
      rank: rankValue,
      label: formatIsoToGraphLabel(node.updatedAt),
    };
  });

  let pathString = "";
  pointCoordinates.forEach((pt, i) => {
    if (i === 0) pathString += `M ${pt.x} ${pt.y}`;
    else pathString += ` L ${pt.x} ${pt.y}`;
  });

  const midIndex = Math.floor(pointCoordinates.length / 2);
  const labelPoints = [
    pointCoordinates[0],
    pointCoordinates[midIndex],
    pointCoordinates[pointCoordinates.length - 1],
  ];

  return (
    <Animated.View
      entering={FadeInUp.duration(500)}
      exiting={FadeOutUp.duration(400)}
      style={styles.graphContainer}
    >
      <Text style={styles.graphHeaderTitle}>Seniority History</Text>

      <Svg
        width="100%"
        height={graphHeight}
        viewBox={`0 0 ${graphWidth} ${graphHeight}`}
      >
        {/* Background Horizontal Guide Grids */}
        <Line
          x1={paddingLeft}
          y1={paddingTop}
          x2={graphWidth - paddingRight}
          y2={paddingTop}
          stroke={isDark ? "#2C2C2E" : "#E5E5EA"}
          strokeWidth="1"
          strokeDasharray="3,3"
        />
        <Line
          x1={paddingLeft}
          y1={paddingTop + chartHeight / 2}
          x2={graphWidth - paddingRight}
          y2={paddingTop + chartHeight / 2}
          stroke={isDark ? "#2C2C2E" : "#E5E5EA"}
          strokeWidth="1"
          strokeDasharray="3,3"
        />
        <Line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={graphWidth - paddingRight}
          y2={paddingTop + chartHeight}
          stroke={isDark ? "#2C2C2E" : "#E5E5EA"}
          strokeWidth="1"
        />

        {/* Premium Blue Line */}
        <Path
          d={pathString}
          fill="none"
          stroke="#007AFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Node Points & Inline Seniority Labels */}
        {pointCoordinates.map((pt, idx) => (
          <React.Fragment key={idx}>
            <SvgText
              x={pt.x}
              y={pt.y - 8}
              fill={themeTextColor}
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
            >
              {pt.rank}
            </SvgText>
            <Circle
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill={isDark ? "#1C1C1E" : "#FFFFFF"}
              stroke="#007AFF"
              strokeWidth="2"
            />
          </React.Fragment>
        ))}

        {/* Bottom X-Axis Time Progression Labels */}
        {labelPoints.map(
          (pt, idx) =>
            pt && (
              <SvgText
                key={idx}
                x={pt.x}
                y={graphHeight - 6}
                fill={themeSubTextColor}
                fontSize="9"
                fontWeight="500"
                textAnchor="middle"
              >
                {pt.label}
              </SvgText>
            ),
        )}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  graphContainer: {
    borderRadius: 8,
    padding: 14,
    marginTop: -6,
    marginBottom: 14,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    width: "100%",
  },
  graphHeaderTitle: {
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.4,
    marginBottom: 16,
    letterSpacing: 0.5,
    alignSelf: "flex-start",
  },
});
