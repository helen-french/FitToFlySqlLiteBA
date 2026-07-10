import {
  formatChartDate,
  getChartDateRange,
  parseUkDateString,
  SeniorityChartPoint,
  SeniorityStatsData,
} from "@/components/seniority/stats/seniorityStatsTypes";
import React, { useMemo } from "react";
import { useColorScheme, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

export type ChartMode = "line" | "bar";

type SeniorityStatsChartProps = {
  data: SeniorityStatsData;
  mode: ChartMode;
};

type PlotPoint = SeniorityChartPoint & { x: number; y: number };

function buildLinePath(points: PlotPoint[]) {
  if (points.length === 0) return "";
  return points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");
}

export default function SeniorityStatsChart({
  data,
  mode,
}: SeniorityStatsChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width: screenWidth } = useWindowDimensions();

  const theme = useMemo(
    () => ({
      subText: isDark ? "#8E8E93" : "#6D6D72",
      axisLabel: isDark ? "#636366" : "#8E8E93",
      grid: isDark ? "rgba(56, 56, 58, 0.9)" : "#ECECF0",
      current: isDark ? "#64B5FF" : "#007AFF",
      projection: isDark ? "rgba(142, 142, 147, 0.85)" : "#8E8E93",
      bar: isDark ? "#64B5FF" : "#007AFF",
      barTrack: isDark ? "rgba(56, 56, 58, 0.65)" : "#F2F2F7",
    }),
    [isDark],
  );

  const chartWidth = screenWidth - 40;
  const chartHeight = mode === "line" ? 228 : 208;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 36;
  const innerW = chartWidth - padL - padR;
  const innerH = chartHeight - padT - padB;

  const dateRange = useMemo(
    () =>
      getChartDateRange([...data.feedPoints, ...data.projectedPoints]),
    [data.feedPoints, data.projectedPoints],
  );

  const allValues = [
    ...data.feedPoints.map((p) => p.value),
    ...data.projectedPoints.map((p) => p.value),
  ];
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const range = maxV - minV || 1;
  const yMin = minV - range * 0.1;
  const yMax = maxV + range * 0.06;
  const ySpan = yMax - yMin || 1;
  const dateSpan = dateRange.max - dateRange.min || 1;

  const toX = (dateStr: string) => {
    const t = parseUkDateString(dateStr);
    return padL + ((t - dateRange.min) / dateSpan) * innerW;
  };

  const toY = (value: number) => padT + ((yMax - value) / ySpan) * innerH;

  const mapPoints = (points: SeniorityChartPoint[]): PlotPoint[] =>
    points.map((p) => ({ ...p, x: toX(p.date), y: toY(p.value) }));

  const feedPts = mapPoints(data.feedPoints);
  const projectedPts = mapPoints(data.projectedPoints);

  const yTicks = [yMax, data.currentSeniority, yMin].map((v) => ({
    value: Math.round(v),
    y: toY(v),
  }));

  const xLabelPoints = data.feedPoints.map((point) => ({
    date: point.date,
    label: formatChartDate(point.date),
    x: toX(point.date),
  }));

  const maxBar = Math.max(
    ...data.monthlyChange.map((b) => Math.abs(b.value)),
    1,
  );

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {yTicks.map((tick) => (
        <Line
          key={tick.value}
          x1={padL}
          y1={tick.y}
          x2={chartWidth - padR}
          y2={tick.y}
          stroke={theme.grid}
          strokeWidth="1"
        />
      ))}

      {mode === "line" ? (
        <>
          <Path
            d={buildLinePath(feedPts)}
            fill="none"
            stroke={theme.current}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <Path
            d={buildLinePath(projectedPts)}
            fill="none"
            stroke={theme.projection}
            strokeWidth="2"
            strokeDasharray="5,5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {feedPts.map((pt, idx) => (
            <Circle
              key={`feed-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill={isDark ? "#1C1C1E" : "#FFFFFF"}
              stroke={theme.current}
              strokeWidth="2.5"
            />
          ))}
        </>
      ) : (
        data.monthlyChange.map((bar) => {
          const x = toX(bar.date) - 10;
          const normalized = Math.abs(bar.value) / maxBar;
          const barH = normalized * (innerH * 0.72);
          const y = padT + innerH - barH;
          return (
            <React.Fragment key={bar.date}>
              <Rect
                x={x}
                y={padT}
                width={20}
                height={innerH}
                rx={6}
                fill={theme.barTrack}
              />
              <Rect
                x={x}
                y={y}
                width={20}
                height={barH}
                rx={6}
                fill={theme.bar}
              />
            </React.Fragment>
          );
        })
      )}

      {yTicks.map((tick) => (
        <SvgText
          key={`y-${tick.value}`}
          x={padL - 6}
          y={tick.y + 4}
          fill={theme.subText}
          fontSize="10"
          textAnchor="end"
        >
          {tick.value}
        </SvgText>
      ))}

      {mode === "line"
        ? xLabelPoints.map((item) => (
            <SvgText
              key={item.date}
              x={item.x}
              y={chartHeight - 10}
              fill={theme.subText}
              fontSize="9"
              textAnchor="middle"
            >
              {item.label}
            </SvgText>
          ))
        : data.monthlyChange.map((item) => (
            <SvgText
              key={item.date}
              x={toX(item.date)}
              y={chartHeight - 10}
              fill={theme.subText}
              fontSize="9"
              textAnchor="middle"
            >
              {formatChartDate(item.date)}
            </SvgText>
          ))}

      <SvgText
        x={padL + innerW / 2}
        y={chartHeight - 1}
        fill={theme.axisLabel}
        fontSize="9"
        fontWeight="600"
        textAnchor="middle"
      >
        Date
      </SvgText>

      <SvgText
        x={10}
        y={padT + innerH / 2}
        fill={theme.axisLabel}
        fontSize="9"
        fontWeight="600"
        textAnchor="middle"
        rotation={-90}
        origin={`10, ${padT + innerH / 2}`}
      >
        Seniority
      </SvgText>
    </Svg>
  );
}
