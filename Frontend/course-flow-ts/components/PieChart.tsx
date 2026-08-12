// components/PieChart.tsx
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import * as d3Shape from 'd3-shape';

type Segment = {
  startAngle: number;
  endAngle: number;
  color: string;
};

interface PieChartProps {
  size?: number;
  strokeWidth?: number;
  segments: Segment[];
}

export default function PieChart({ size = 200, strokeWidth = 20, segments }: PieChartProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  const arcs = segments.map((seg) => {
    const arcGenerator = d3Shape.arc<d3Shape.DefaultArcObject>()
      .cornerRadius(strokeWidth / 2);


    const arcData: d3Shape.DefaultArcObject = {
      innerRadius: radius - strokeWidth,
      outerRadius: radius,
      startAngle: seg.startAngle,
      endAngle: seg.endAngle,
    };

    return {
      path: arcGenerator(arcData)!,
      color: seg.color,
    };
  });

  return (
    <View>
      <Svg width={size} height={size}>
        <G x={center} y={center}>
          {arcs.map((arc, index) => (
            <Path key={index} d={arc.path} fill={arc.color} />
          ))}
        </G>
      </Svg>
    </View>
  );
}
