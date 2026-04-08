"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { format } from "date-fns"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useRevOps } from "@/lib/revops-context"
import { computeMonthlyRollups } from "@/lib/revops-data"
import { DateRangeFilter, applyDateRange, type DateRange } from "@/components/date-range-filter"

// All 10 numeric metrics — each with a distinct color
const METRICS = [
  { key: "newCustomers",    label: "New Customers",     color: "#3b82f6", suffix: "" },
  { key: "pipelineValue",   label: "Pipeline (€k)",     color: "#06b6d4", suffix: "€k" },
  { key: "closeRate",       label: "Close Rate",        color: "#10b981", suffix: "%" },
  { key: "salesCycleDays",  label: "Sales Cycle",       color: "#84cc16", suffix: "d" },
  { key: "feedRetention",   label: "Feed Retention",    color: "#8b5cf6", suffix: "%" },
  { key: "offersSent",      label: "Offers Sent",       color: "#a855f7", suffix: "" },
  { key: "ordersReceived",  label: "Orders Received",   color: "#f59e0b", suffix: "" },
  { key: "feedSlaScore",    label: "SLA Score",         color: "#f97316", suffix: "" },
  { key: "incidentCount",   label: "Incidents",         color: "#ef4444", suffix: "" },
  { key: "customerMeetings",label: "Cust. Meetings",    color: "#ec4899", suffix: "" },
] as const

type MetricKey = typeof METRICS[number]["key"]

const chartConfig = Object.fromEntries(
  METRICS.map(({ key, label, color }) => [key, { label, color }])
) satisfies ChartConfig

type RawPoint = { date: string } & Record<MetricKey, number>
type NormPoint = { date: string } & Record<MetricKey, number> & Record<`raw_${MetricKey}`, number>

/** Scale each metric independently to 0-10 range for stackable display.
 *  Real values are stored under raw_<key> and shown in the tooltip. */
function normalize(raw: RawPoint[]): NormPoint[] {
  if (raw.length === 0) return []
  const ranges = {} as Record<MetricKey, { min: number; max: number }>
  for (const m of METRICS) {
    const vals = raw.map((d) => d[m.key])
    ranges[m.key] = { min: Math.min(...vals), max: Math.max(...vals) }
  }
  return raw.map((d) => {
    const pt: Record<string, number | string> = { date: d.date }
    for (const m of METRICS) {
      const { min, max } = ranges[m.key]
      pt[m.key] = min === max ? 5 : Math.round(((d[m.key] - min) / (max - min)) * 90 + 5)
      pt[`raw_${m.key}`] = m.key === "pipelineValue"
        ? Math.round(d[m.key] / 1000)
        : d[m.key]
    }
    return pt as NormPoint
  })
}

function StackedTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; color: string; payload: Record<string, number> }>
  label?: string
}) {
  if (!active || !payload?.length || !label) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md min-w-[200px]">
      <p className="mb-2 text-sm font-semibold">
        {format(new Date(label), "MMM d, yyyy")}
      </p>
      <div className="space-y-1">
        {METRICS.map(({ key, label: lbl, color, suffix }) => (
          <div key={key} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-sm" style={{ background: color }} />
              <span className="text-muted-foreground">{lbl}</span>
            </div>
            <span className="font-medium tabular-nums">
              {p[`raw_${key}`]}{suffix}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground italic">
        Bar height normalised for visibility · hover values are real
      </p>
    </div>
  )
}

export function OverviewChart() {
  const { entries } = useRevOps()
  const [viewMode, setViewMode] = React.useState<"weekly" | "monthly">("weekly")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)
  const monthly = computeMonthlyRollups(entries)

  const weeklyRaw: RawPoint[] = entries.map((e) => ({
    date: e.weekStart,
    newCustomers: e.newCustomers,
    pipelineValue: e.pipelineValue,
    closeRate: e.closeRate,
    salesCycleDays: e.salesCycleDays,
    feedRetention: e.feedRetention,
    offersSent: e.offersSent,
    ordersReceived: e.ordersReceived,
    feedSlaScore: e.feedSlaScore,
    incidentCount: e.incidentCount,
    customerMeetings: e.customerMeetings,
  }))

  const monthlyRaw: RawPoint[] = monthly.map((m) => ({
    date: m.month + "-15",
    newCustomers: m.newCustomers,
    pipelineValue: m.pipelineValueAvg,
    closeRate: m.closeRateAvg,
    salesCycleDays: m.salesCycleDaysAvg,
    feedRetention: m.feedRetentionAvg,
    offersSent: m.offersSent,
    ordersReceived: m.ordersReceived,
    feedSlaScore: m.feedSlaScoreAvg,
    incidentCount: m.incidentCount,
    customerMeetings: m.customerMeetings,
  }))

  const rawData = viewMode === "weekly" ? weeklyRaw : monthlyRaw
  const filtered = applyDateRange(rawData, dateRange)
  const chartData = normalize(filtered)

  if (rawData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overview — All Key Metrics</CardTitle>
          <CardDescription>All key metrics stacked by week</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
          No data yet — add your first week in the &quot;Enter Data&quot; tab.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Overview — All Key Metrics</CardTitle>
            <CardDescription className="mt-1">
              All 10 metrics stacked · hover a bar for real values
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as "weekly" | "monthly")}
              variant="outline"
            >
              <ToggleGroupItem value="weekly" className="text-xs px-2.5">Weekly</ToggleGroupItem>
              <ToggleGroupItem value="monthly" className="text-xs px-2.5">Monthly</ToggleGroupItem>
            </ToggleGroup>
            <DateRangeFilter range={dateRange} onRangeChange={setDateRange} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-0 sm:px-6">
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No data in selected range.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[380px] w-full">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              barCategoryGap="20%"
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={20}
                tickFormatter={(v) => format(new Date(v), "MMM d")}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={28}
                hide
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                content={<StackedTooltip />}
              />
              <ChartLegend content={<ChartLegendContent />} className="flex-wrap gap-x-4 gap-y-1 pt-4" />
              {METRICS.map(({ key, color }) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="stack"
                  fill={color}
                  radius={key === METRICS[METRICS.length - 1].key ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
