"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type WeekPoint = {
  isoWeek: string;
  spend: number;
  roas: number | null;
  hookRate: number | null;
};

const config = {
  spend: { label: "Spend", color: "var(--chart-2)" },
  roas: { label: "ROAS", color: "var(--chart-5)" },
  hookRate: { label: "Hook rate", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function CreativeCharts({ series }: { series: WeekPoint[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <MiniChart
        title="Spend"
        dataKey="spend"
        series={series}
        format={(v) => `${Math.round(v)} €`}
      />
      <MiniChart
        title="ROAS"
        dataKey="roas"
        series={series}
        format={(v) => v.toFixed(2)}
      />
      <MiniChart
        title="Hook rate"
        dataKey="hookRate"
        series={series}
        format={(v) => `${(v * 100).toFixed(0)} %`}
      />
    </div>
  );
}

function MiniChart({
  title,
  dataKey,
  series,
  format,
}: {
  title: string;
  dataKey: "spend" | "roas" | "hookRate";
  series: WeekPoint[];
  format: (v: number) => string;
}) {
  const hasData = series.some((p) => p[dataKey] !== null);

  return (
    <Card className="gap-0 py-3">
      <CardHeader className="px-3 pb-1">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        {hasData ? (
          <ChartContainer config={config} className="h-28 w-full">
            <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="2 4" />
              <XAxis
                dataKey="isoWeek"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                fontSize={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={10}
                width={46}
                tickCount={4}
                tickFormatter={(v) => format(Number(v))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => format(Number(value))}
                  />
                }
              />
              <Line
                dataKey={dataKey}
                type="monotone"
                stroke={`var(--color-${dataKey})`}
                strokeWidth={1.5}
                dot={{ r: 2 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <p className="text-muted-foreground px-1 py-6 text-center text-xs">
            Pas de donnée
          </p>
        )}
      </CardContent>
    </Card>
  );
}
