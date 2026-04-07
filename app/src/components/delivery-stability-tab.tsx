"use client"

import * as React from "react"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis,
} from "recharts"
import { format } from "date-fns"
import {
  Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useRevOps } from "@/lib/revops-context"
import { computeMonthlyRollups } from "@/lib/revops-data"
import { DateRangeFilter, applyDateRange, type DateRange } from "@/components/date-range-filter"

const CHART_COLORS = {
  feedRetention:  "#8b5cf6",  // violet
  offersSent:     "#3b82f6",  // blue
  ordersReceived: "#10b981",  // emerald
  feedSlaScore:   "#f59e0b",  // amber
  incidentCount:  "#ef4444",  // rose
} as const

const config = {
  feedRetention:  { label: "Feed Retention %",  color: CHART_COLORS.feedRetention },
  offersSent:     { label: "Offers Sent",        color: CHART_COLORS.offersSent },
  ordersReceived: { label: "Orders Received",    color: CHART_COLORS.ordersReceived },
  feedSlaScore:   { label: "SLA Score %",        color: CHART_COLORS.feedSlaScore },
  incidentCount:  { label: "Incidents",          color: CHART_COLORS.incidentCount },
} satisfies ChartConfig

export function DeliveryStabilityTab() {
  const { entries } = useRevOps()
  const [view, setView] = React.useState<"weekly" | "monthly">("weekly")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)
  const monthly = computeMonthlyRollups(entries)

  const weekly = entries.map((e) => ({
    date: e.weekStart,
    feedRetention: e.feedRetention,
    offersSent: e.offersSent,
    ordersReceived: e.ordersReceived,
    feedSlaScore: e.feedSlaScore,
    incidentCount: e.incidentCount,
  }))

  const monthlyData = monthly.map((m) => ({
    date: m.month + "-15",
    feedRetention: m.feedRetentionAvg,
    offersSent: m.offersSent,
    ordersReceived: m.ordersReceived,
    feedSlaScore: m.feedSlaScoreAvg,
    incidentCount: m.incidentCount,
  }))

  const rawData = view === "weekly" ? weekly : monthlyData
  const data = applyDateRange(rawData, dateRange)

  if (rawData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground px-4">
        No data yet. Add your first week in the &ldquo;Enter Data&rdquo; tab.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6">
        <h2 className="text-lg font-semibold">C) Delivery &amp; Stability</h2>
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
          <MiniLine title="Feed Retention %" metric="feedRetention" data={data} />
          <MiniLine title="SLA Score %" metric="feedSlaScore" data={data} />
          <MiniBar title="Offers Sent vs Orders Received" metric="offersSent" metric2="ordersReceived" data={data} />
          <MiniBar title="Incidents" metric="incidentCount" data={data} />
        </div>
      )}
    </div>
  )
}

type MetricKey = keyof typeof config

function MiniLine({
  title,
  metric,
  data,
}: {
  title: string
  metric: MetricKey
  data: Record<string, number | string>[]
}) {
  const singleConfig = { [metric]: config[metric] } as ChartConfig

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm shrink-0" style={{ background: CHART_COLORS[metric] }} />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{config[metric].label}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ChartContainer config={singleConfig} className="h-[180px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`fill-${metric}-delivery`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${metric})`} stopOpacity={0.5} />
                <stop offset="95%" stopColor={`var(--color-${metric})`} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => format(new Date(v), "MMM d")} />
            <YAxis tickLine={false} axisLine={false} tickMargin={4} width={36} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")} indicator="dot" />} />
            <Area
              dataKey={metric}
              type="monotone"
              fill={`url(#fill-${metric}-delivery)`}
              stroke={`var(--color-${metric})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function MiniBar({
  title, metric, metric2, data,
}: {
  title: string
  metric: MetricKey
  metric2?: MetricKey
  data: Record<string, number | string>[]
}) {
  const cfg = metric2
    ? { [metric]: config[metric], [metric2]: config[metric2] } as ChartConfig
    : { [metric]: config[metric] } as ChartConfig

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm shrink-0" style={{ background: CHART_COLORS[metric] }} />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{config[metric].label}{metric2 ? ` vs ${config[metric2].label}` : ""}</CardDescription>
        <CardAction>
          <Badge variant="secondary">Bar</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ChartContainer config={cfg} className="h-[180px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => format(new Date(v), "MMM d")} />
            <YAxis tickLine={false} axisLine={false} tickMargin={4} width={36} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={[3, 3, 0, 0]} />
            {metric2 && <Bar dataKey={metric2} fill={`var(--color-${metric2})`} radius={[3, 3, 0, 0]} />}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
