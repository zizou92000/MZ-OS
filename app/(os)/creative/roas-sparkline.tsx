"use client";

import { Area, AreaChart, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  roas: { label: "ROAS", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function RoasSparkline({
  data,
  target,
}: {
  data: { isoWeek: string; roas: number | null; spend: number }[];
  target: number | null;
}) {
  return (
    <ChartContainer config={config} className="h-24 w-full">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="roasFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.14} />
            <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="isoWeek"
          tickLine={false}
          axisLine={false}
          fontSize={9}
          tickMargin={4}
        />
        <YAxis hide domain={[0, "dataMax + 0.3"]} />
        {target !== null && (
          <ReferenceLine
            y={target}
            stroke="var(--verdict-winner)"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{
              value: `cible ${target.toFixed(2)}`,
              position: "insideTopRight",
              fontSize: 9,
              fill: "var(--verdict-winner)",
            }}
          />
        )}
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(v) => Number(v).toFixed(2)} />
          }
        />
        {/* Neutral trace, gold target line: the crossing is the only signal. */}
        <Area
          dataKey="roas"
          type="monotone"
          stroke="var(--foreground)"
          strokeWidth={1.5}
          fill="url(#roasFill)"
          connectNulls
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
