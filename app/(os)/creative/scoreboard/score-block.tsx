"use client";

import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { money, percent, ratio } from "@/lib/format";
import type { ScoreBlock as Block } from "@/lib/scoreboard";
import { cn } from "@/lib/utils";

const config = {
  roas: { label: "ROAS", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ScoreBlock({
  block,
  rateLabel,
}: {
  block: Block;
  rateLabel: string;
}) {
  const chartRows = block.rows.filter((r) => r.significant && r.roas !== null);

  return (
    <Card className="gap-0 py-3">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="text-sm">{block.title}</CardTitle>
        <CardDescription className="text-xs">{block.hint}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        {block.rows.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-xs">
            Aucune donnée sur cet axe.
          </p>
        ) : (
          <>
            <Table className="min-w-[34rem]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-7 text-[11px]">Valeur</TableHead>
                  <TableHead className="h-7 text-right text-[11px]">Nb</TableHead>
                  <TableHead className="h-7 text-right text-[11px]">
                    Spend
                  </TableHead>
                  <TableHead className="h-7 text-right text-[11px]">CA</TableHead>
                  <TableHead className="h-7 text-right text-[11px]">
                    {rateLabel}
                  </TableHead>
                  <TableHead className="h-7 text-right text-[11px]">
                    ROAS
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {block.rows.map((row) => (
                  <TableRow
                    key={row.key}
                    className={cn(
                      "hover:bg-transparent",
                      // Insufficient rows are visually neutralised so the eye
                      // never ranks them against the real ones.
                      !row.significant && "text-muted-foreground opacity-50",
                    )}
                  >
                    <TableCell className="py-1 text-xs">
                      <span className="flex items-center gap-1.5">
                        {row.label}
                        {!row.significant && (
                          <Badge
                            variant="outline"
                            className="rounded-sm px-1 py-0 text-[9px] font-normal"
                          >
                            données insuffisantes
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="num py-1 text-right text-xs">
                      {row.count}
                    </TableCell>
                    <TableCell className="num py-1 text-right text-xs">
                      {money(row.spend)}
                    </TableCell>
                    <TableCell className="num py-1 text-right text-xs">
                      {money(row.revenue)}
                    </TableCell>
                    <TableCell className="num py-1 text-right text-xs">
                      {rateLabel === "Hook"
                        ? percent(row.hookRate, 0)
                        : percent(row.ctr, 2)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "num py-1 text-right text-xs",
                        row.significant && "font-semibold",
                      )}
                    >
                      {ratio(row.roas)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {chartRows.length > 0 && (
              <ChartContainer
                config={config}
                className="w-full"
                style={{ height: chartRows.length * 24 + 28 }}
              >
                <BarChart
                  data={chartRows}
                  layout="vertical"
                  margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={110}
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => Number(v).toFixed(2)}
                      />
                    }
                  />
                  <Bar
                    dataKey="roas"
                    radius={2}
                    barSize={12}
                    isAnimationActive={false}
                  >
                    {chartRows.map((r) => (
                      <Cell key={r.key} fill="var(--chart-1)" />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
