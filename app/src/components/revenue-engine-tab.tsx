"use client"

import * as React from "react"
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis,
} from "recharts"
import { format } from "date-fns"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useRevOps } from "@/lib/revops-context"
import { computeMonthlyRollups } from "@/lib/revops-data"
import { DateRangeFilter, applyDateRange, type DateRange } from "@/components/date-range-filter"

// Distinctive explicit colors
const CHART_COLORS = {
  newCustomers:  "#3b82f6",  // blue
  pipelineValue: "#10b981",  // emerald
  closeRate:     "#f59e0b",  // amber
  salesCycleDays:"#ef4444",  // rose — inverse metric, red makes sense
} as const

const config = {
  newCustomers:   { label: "New Customers",    color: CHART_COLORS.newCustomers },
  pipelineValue:  { label: "Pipeline (€k)",    color: CHART_COLORS.pipelineValue },
  closeRate:      { label: "Close Rate %",     color: CHART_COLORS.closeRate },
  salesCycleDays: { label: "Sales Cycle (d)",  color: CHART_COLORS.salesCycleDays },
} satisfies ChartConfig

export function RevenueEngineTab() {
  const { entries } = useRevOps()
  const [view, setView] = React.useState<"weekly" | "monthly">("weekly")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)
  const monthly = computeMonthlyRollups(entries)

  const weekly = entries.map((e) => ({
    date: e.weekStart,
    newCustomers: e.newCustomers,
    pipelineValue: Math.round(e.pipelineValue / 1000),
    closeRate: e.closeRate,
    salesCycleDays: e.salesCycleDays,
  }))

  const monthlyData = monthly.map((m) => ({
    date: m.month + "-15",
    newCustomers: m.newCustomers,
    pipelineValue: Math.round(m.pipelineValueAvg / 1000),
    closeRate: m.closeRateAvg,
    salesCycleDays: m.salesCycleDaysAvg,
  }))

  const rawData = view === "weekly" ? weekly : monthlyData
  const data = applyDateRange(rawData, dateRange)

  if (rawData.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6">
        <h2 className="text-lg font-semibold">A) Revenue Engine</h2>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as "weekly" | "monthly")} variant="outline">
            <ToggleGroupItem value="weekly" className="text-xs px-2.5">Weekly</ToggleGroupItem>
            <ToggleGroupItem value="monthly" className="text-xs px-2.5">Monthly</ToggleGroupItem>
          </ToggleGroup>
          <DateRangeFilter range={dateRange} onRangeChange={setDateRange} />
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No data in selected range.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
          <ChartCard title="New Customers" desc="Signed per period" data={data} metric="newCustomers" color={CHART_COLORS.newCustomers} config={config} />
          <ChartCard title="Pipeline Value (€k)" desc="Avg active pipeline" data={data} metric="pipelineValue" color={CHART_COLORS.pipelineValue} config={config} />
          <ChartCard title="Close Rate %" desc="Win rate on proposals" data={data} metric="closeRate" color={CHART_COLORS.closeRate} config={config} />
          <ChartCard title="Sales Cycle (days)" desc="Avg days to close" data={data} metric="salesCycleDays" color={CHART_COLORS.salesCycleDays} config={config} />
        </div>
      )}
    </div>
  )
}

function ChartCard({
  title, desc, data, metric, color, config,
}: {
  title: string
  desc: string
  data: Record<string, number | string>[]
  metric: string
  color: string
  config: ChartConfig
}) {
  const singleConfig = { [metric]: (config as Record<string, { label: string; color: string }>)[metric] } as ChartConfig
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm shrink-0" style={{ background: color }} />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ChartContainer config={singleConfig} className="h-[180px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => format(new Date(v), "MMM d")} />
            <YAxis tickLine={false} axisLine={false} tickMargin={4} width={36} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")} indicator="dot" />} />
            <Area dataKey={metric} type="monotone" fill={`url(#fill-${metric})`} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex h-64 items-center justify-center text-muted-foreground px-4">
      No data yet. Add your first week in the &ldquo;Enter Data&rdquo; tab.
    </div>
  )
}
